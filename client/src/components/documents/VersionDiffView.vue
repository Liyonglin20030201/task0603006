<template>
  <div class="diff-panel">
    <div class="diff-header">
      <h3>Version Comparison</h3>
      <button class="close-btn" @click="$emit('close')" title="Close">×</button>
    </div>

    <div class="diff-controls">
      <div class="diff-selectors">
        <div class="selector">
          <label>Base (older):</label>
          <select v-model="selectedA" @change="loadDiff">
            <option value="">-- Select --</option>
            <option v-for="v in versions" :key="v.id" :value="v.id">
              v{{ v.version_number }} · {{ v.title }}
            </option>
          </select>
        </div>
        <span class="arrow">→</span>
        <div class="selector">
          <label>Compare (newer):</label>
          <select v-model="selectedB" @change="loadDiff">
            <option value="">-- Select --</option>
            <option value="__current__">Current Document</option>
            <option v-for="v in versions" :key="v.id" :value="v.id">
              v{{ v.version_number }} · {{ v.title }}
            </option>
          </select>
        </div>
      </div>
      <div class="diff-actions">
        <button
          v-if="canRestoreA"
          class="btn-restore"
          @click="restoreA"
          :disabled="restoring"
        >{{ restoring ? 'Restoring...' : 'Restore Base Version' }}</button>
        <button
          v-if="canRestoreB"
          class="btn-restore"
          @click="restoreB"
          :disabled="restoring"
        >{{ restoring ? 'Restoring...' : 'Restore Compare Version' }}</button>
        <div class="view-toggle">
          <button :class="{ active: viewMode === 'unified' }" @click="viewMode = 'unified'">Unified</button>
          <button :class="{ active: viewMode === 'split' }" @click="viewMode = 'split'">Split</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="status-msg">Loading...</div>

    <div v-else-if="diffResult.length > 0" class="diff-content">
      <div class="diff-stats">
        <span class="stat added">+{{ addedCount }} added</span>
        <span class="stat removed">-{{ removedCount }} removed</span>
      </div>

      <div v-if="viewMode === 'unified'" class="diff-unified">
        <div v-for="(line, idx) in diffResult" :key="idx" class="diff-line" :class="line.type">
          <span class="line-prefix">{{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}</span>
          <span class="line-content">{{ line.value || ' ' }}</span>
        </div>
      </div>

      <div v-else class="diff-split">
        <div class="split-pane split-left">
          <div class="split-label">Base</div>
          <div v-for="(line, idx) in splitLeft" :key="idx" class="diff-line" :class="line.type">
            <span class="line-num">{{ line.lineNum || '' }}</span>
            <span class="line-content">{{ line.value || ' ' }}</span>
          </div>
        </div>
        <div class="split-pane split-right">
          <div class="split-label">Compare</div>
          <div v-for="(line, idx) in splitRight" :key="idx" class="diff-line" :class="line.type">
            <span class="line-num">{{ line.lineNum || '' }}</span>
            <span class="line-content">{{ line.value || ' ' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="selectedA && selectedB && !loading" class="status-msg">
      No differences found between these versions.
    </div>
    <div v-else class="status-msg hint">
      Select two versions above to compare their content.
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { documentsApi } from '../../api/documents.js'
import { useDiff } from '../../composables/useDiff.js'

const props = defineProps({
  documentId: String,
  versions: Array,
  currentText: { type: String, default: '' }
})

const emit = defineEmits(['close', 'restore'])

const { computeLineDiff } = useDiff()

const selectedA = ref('')
const selectedB = ref('')
const viewMode = ref('unified')
const diffResult = ref([])
const loading = ref(false)
const restoring = ref(false)

const canRestoreA = computed(() => selectedA.value && diffResult.value.length > 0)
const canRestoreB = computed(() => selectedB.value && selectedB.value !== '__current__' && diffResult.value.length > 0)

const addedCount = computed(() => diffResult.value.filter(l => l.type === 'added').length)
const removedCount = computed(() => diffResult.value.filter(l => l.type === 'removed').length)

async function loadDiff() {
  if (!selectedA.value || !selectedB.value) {
    diffResult.value = []
    return
  }
  if (selectedA.value === selectedB.value) {
    diffResult.value = []
    return
  }

  loading.value = true
  try {
    let textA, textB

    if (selectedB.value === '__current__') {
      const { data } = await documentsApi.getVersion(props.documentId, selectedA.value)
      textA = data.content_text || ''
      textB = props.currentText || ''
    } else {
      const { data } = await documentsApi.compareVersions(props.documentId, selectedA.value, selectedB.value)
      textA = data.versionA.content_text || ''
      textB = data.versionB.content_text || ''
    }

    diffResult.value = computeLineDiff(textA, textB)
  } catch (err) {
    diffResult.value = []
  } finally {
    loading.value = false
  }
}

async function restoreA() {
  if (!selectedA.value) return
  if (!confirm('Restore to the base version? Current content will be saved as a new version first.')) return
  restoring.value = true
  try {
    await documentsApi.restoreVersion(props.documentId, selectedA.value)
    emit('restore')
  } catch (err) {
    console.error('Restore failed:', err)
  } finally {
    restoring.value = false
  }
}

async function restoreB() {
  if (!selectedB.value || selectedB.value === '__current__') return
  if (!confirm('Restore to the compare version? Current content will be saved as a new version first.')) return
  restoring.value = true
  try {
    await documentsApi.restoreVersion(props.documentId, selectedB.value)
    emit('restore')
  } catch (err) {
    console.error('Restore failed:', err)
  } finally {
    restoring.value = false
  }
}

const splitLeft = computed(() => {
  const lines = []
  let lineNum = 0
  for (const line of diffResult.value) {
    if (line.type === 'equal') {
      lineNum++
      lines.push({ type: 'equal', value: line.value, lineNum })
    } else if (line.type === 'removed') {
      lineNum++
      lines.push({ type: 'removed', value: line.value, lineNum })
    } else {
      lines.push({ type: 'empty', value: '', lineNum: '' })
    }
  }
  return lines
})

const splitRight = computed(() => {
  const lines = []
  let lineNum = 0
  for (const line of diffResult.value) {
    if (line.type === 'equal') {
      lineNum++
      lines.push({ type: 'equal', value: line.value, lineNum })
    } else if (line.type === 'added') {
      lineNum++
      lines.push({ type: 'added', value: line.value, lineNum })
    } else {
      lines.push({ type: 'empty', value: '', lineNum: '' })
    }
  }
  return lines
})
</script>

<style scoped>
.diff-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}
.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--gray-200);
}
.diff-header h3 { font-size: 1rem; font-weight: 600; margin: 0; }
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--gray-400);
  line-height: 1;
  padding: 0.25rem;
}
.close-btn:hover { color: var(--gray-700); }
.diff-controls {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--gray-100);
  flex-wrap: wrap;
}
.diff-selectors {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  flex: 1;
}
.diff-actions {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.btn-restore {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--primary);
  background: white;
  color: var(--primary);
  border-radius: var(--radius);
  cursor: pointer;
  white-space: nowrap;
}
.btn-restore:hover:not(:disabled) { background: var(--primary); color: white; }
.btn-restore:disabled { opacity: 0.5; cursor: not-allowed; }
.arrow {
  font-size: 1.1rem;
  color: var(--gray-400);
  padding-bottom: 0.35rem;
}
.selector {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
}
.selector label {
  font-size: 0.7rem;
  color: var(--gray-500);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.selector select {
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius);
  font-size: 0.8rem;
  width: 100%;
  background: white;
}
.view-toggle {
  display: flex;
  flex-shrink: 0;
}
.view-toggle button {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--gray-300);
  background: white;
  cursor: pointer;
  color: var(--gray-600);
}
.view-toggle button:first-child { border-radius: var(--radius) 0 0 var(--radius); }
.view-toggle button:last-child { border-radius: 0 var(--radius) var(--radius) 0; border-left: none; }
.view-toggle button.active { background: var(--primary); color: white; border-color: var(--primary); }
.diff-content {
  flex: 1;
  overflow-y: auto;
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.5;
}
.diff-stats {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-100);
  font-size: 0.75rem;
  font-weight: 600;
}
.stat.added { color: #16a34a; }
.stat.removed { color: #dc2626; }
.diff-unified { padding: 0; }
.diff-line {
  display: flex;
  padding: 0 1rem;
  min-height: 1.5em;
}
.diff-line.added { background: #dcfce7; }
.diff-line.removed { background: #fee2e2; }
.diff-line.empty { background: var(--gray-50); min-height: 1.5em; }
.line-prefix {
  width: 1.5rem;
  flex-shrink: 0;
  color: var(--gray-400);
  font-weight: 700;
  user-select: none;
}
.line-num {
  width: 3rem;
  flex-shrink: 0;
  color: var(--gray-400);
  text-align: right;
  padding-right: 0.75rem;
  user-select: none;
}
.line-content {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
}
.diff-split {
  display: flex;
  height: 100%;
}
.split-pane {
  flex: 1;
  overflow-y: auto;
}
.split-left { border-right: 1px solid var(--gray-200); }
.split-label {
  position: sticky;
  top: 0;
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--gray-500);
  padding: 0.4rem 1rem;
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-100);
  z-index: 1;
}
.status-msg {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
  font-size: 0.9rem;
}
.status-msg.hint { font-style: italic; }
</style>
