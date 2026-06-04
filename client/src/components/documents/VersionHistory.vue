<template>
  <div class="version-panel">
    <div class="version-panel-header">
      <h3>Version History</h3>
    </div>
    <div class="version-actions">
      <button class="btn-primary btn-sm" @click="createSnapshot">
        Save Snapshot
      </button>
      <button class="btn-secondary btn-sm" @click="$emit('toggle-diff')">
        Compare Versions
      </button>
    </div>

    <div class="version-list">
      <div v-if="versions.length === 0" class="empty">
        No versions saved yet. Click "Save Snapshot" to create one.
      </div>
      <div v-for="v in versions" :key="v.id" class="version-item">
        <div class="version-info">
          <div class="version-top">
            <span class="version-num">v{{ v.version_number }}</span>
            <span class="version-title">{{ v.title }}</span>
          </div>
          <span class="version-meta">{{ v.created_by_name }} · {{ formatDate(v.created_at) }}</span>
        </div>
        <button class="btn-secondary btn-xs" @click="restoreVersion(v.id)">Restore</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { documentsApi } from '../../api/documents.js'

const props = defineProps({ documentId: String })
const emit = defineEmits(['restored', 'toggle-diff'])
const versions = ref([])

onMounted(loadVersions)

async function loadVersions() {
  const { data } = await documentsApi.listVersions(props.documentId)
  versions.value = data
}

async function createSnapshot() {
  await documentsApi.createVersion(props.documentId)
  await loadVersions()
}

async function restoreVersion(versionId) {
  if (confirm('Restore this version? Current content will be saved as a new version first.')) {
    await documentsApi.restoreVersion(props.documentId, versionId)
    emit('restored')
    await loadVersions()
  }
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts + 'Z').toLocaleString()
}

defineExpose({ versions, loadVersions })
</script>

<style scoped>
.version-panel {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.version-panel-header {
  margin-bottom: 0.75rem;
}
.version-panel-header h3 { font-size: 0.95rem; font-weight: 600; margin: 0; }
.version-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.version-list {
  flex: 1;
  overflow-y: auto;
}
.empty {
  color: var(--gray-400);
  font-size: 0.85rem;
  text-align: center;
  padding: 1.5rem 0;
}
.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid var(--gray-100);
  gap: 0.5rem;
}
.version-item:hover { background: var(--gray-50); border-radius: var(--radius); }
.version-info { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
.version-top { display: flex; align-items: center; gap: 0.4rem; }
.version-num { font-weight: 700; font-size: 0.75rem; color: var(--primary); flex-shrink: 0; }
.version-title { font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.version-meta { font-size: 0.7rem; color: var(--gray-400); }
.btn-xs {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  flex-shrink: 0;
}
</style>
