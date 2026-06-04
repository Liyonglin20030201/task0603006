<template>
  <div class="diff-panel">
    <div class="diff-header">
      <h3>Version Comparison</h3>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>

    <div class="diff-selectors">
      <div class="selector">
        <label>Version A:</label>
        <select v-model="selectedA" @change="loadDiff">
          <option value="">Select version</option>
          <option v-for="v in versions" :key="v.id" :value="v.id">v{{ v.version_number }} - {{ v.title }}</option>
        </select>
      </div>
      <div class="selector">
        <label>Version B:</label>
        <select v-model="selectedB" @change="loadDiff">
          <option value="">Select version</option>
          <option v-for="v in versions" :key="v.id" :value="v.id">v{{ v.version_number }} - {{ v.title }}</option>
        </select>
      </div>
      <div class="view-toggle">
        <button :class="{ active: viewMode === 'unified' }" @click="viewMode = 'unified'">Unified</button>
        <button :class="{ active: viewMode === 'split' }" @click="viewMode = 'split'">Split</button>
      </div>
    </div>

    <div v-if="loading" class="loading">Computing diff...</div>

    <div v-else-if="diffResult.length > 0" class="diff-content">
      <!-- Unified view -->
      <div v-if="viewMode === 'unified'" class="diff-unified">
        <div v-for="(line, idx) in diffResult" :key="idx" class="diff-line" :class="line.type">
          <span class="line-prefix">{{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}</span>
          <span class="line-content">{{ line.value }}</span>
        </div>
      </div>

      <!-- Split view -->
      <div v-else class="diff-split">
        <div class="split-left">
          <div class="split-header">Version A</div>
          <div v-for="(line, idx) in splitLeft" :key="idx" class="diff-line" :class="line.type">
            <span class="line-num">{{ line.lineNum || '' }}</span>
            <span class="line-content">{{ line.value }}</span>
          </div>
        </div>
        <div class="split-right">
          <div class="split-header">Version B</div>
          <div v-for="(line, idx) in splitRight" :key="idx" class="diff-line" :class="line.type">
            <span class="line-num">{{ line.lineNum || '' }}</span>
            <span class="line-content">{{ line.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="selectedA && selectedB" class="empty">
      <p>No differences found.</p>
    </div>
    <div v-else class="empty">
      <p>Select two versions to compare.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { documentsApi } from '../../api/documents.js'
import { useDiff } from '../../composables/useDiff.js'

const props = defineProps({
  documentId: String,
  versions: Array
})

defineEmits(['close'])

const { computeLineDiff } = useDiff()

const selectedA = ref('')
const selectedB = ref('')
const viewMode = ref('unified')
const diffResult = ref([])
const loading = ref(false)

async function loadDiff() {
  if (!selectedA.value || !selectedB.value) {
    diffResult.value = []
    return
  }
  loading.value = true
  try {
    const { data } = await documentsApi.compareVersions(props.documentId, selectedA.value, selectedB.value)
    diffResult.value = computeLineDiff(data.versionA.content_text, data.versionB.content_text)
  } finally {
    loading.value = false
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
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.diff-header h3 { font-size: 0.95rem; font-weight: 600; }
.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--gray-500);
}
.diff-selectors {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.selector {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.selector label { font-size: 0.75rem; color: var(--gray-600); font-weight: 500; }
.selector select {
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius);
  font-size: 0.8rem;
}
.view-toggle {
  display: flex;
  gap: 2px;
}
.view-toggle button {
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
  border: 1px solid var(--gray-300);
  background: white;
  cursor: pointer;
}
.view-toggle button:first-child { border-radius: var(--radius) 0 0 var(--radius); }
.view-toggle button:last-child { border-radius: 0 var(--radius) var(--radius) 0; }
.view-toggle button.active { background: var(--primary); color: white; border-color: var(--primary); }
.diff-content {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  font-family: monospace;
  font-size: 0.8rem;
}
.diff-unified { padding: 0.5rem; }
.diff-line {
  display: flex;
  padding: 0.1rem 0.5rem;
  white-space: pre-wrap;
  word-break: break-all;
}
.diff-line.added { background: #dcfce7; }
.diff-line.removed { background: #fee2e2; }
.diff-line.empty { background: var(--gray-50); }
.line-prefix {
  width: 1.5rem;
  flex-shrink: 0;
  color: var(--gray-400);
  font-weight: 600;
}
.line-num {
  width: 2.5rem;
  flex-shrink: 0;
  color: var(--gray-400);
  text-align: right;
  padding-right: 0.5rem;
}
.line-content { flex: 1; }
.diff-split {
  display: flex;
  height: 100%;
}
.split-left, .split-right {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}
.split-left { border-right: 1px solid var(--gray-200); }
.split-header {
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--gray-600);
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.5rem;
  background: var(--gray-50);
  border-radius: var(--radius);
}
.loading, .empty {
  text-align: center;
  color: var(--gray-400);
  font-size: 0.85rem;
  padding: 2rem;
}
</style>
