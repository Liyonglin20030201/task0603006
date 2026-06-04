<template>
  <div class="version-panel">
    <h3>Version History</h3>
    <div class="version-actions-top">
      <button class="btn-primary btn-sm" @click="createSnapshot">Save Snapshot</button>
      <button class="btn-secondary btn-sm" @click="showDiff = !showDiff">
        {{ showDiff ? 'Hide Diff' : 'Compare' }}
      </button>
    </div>

    <VersionDiffView
      v-if="showDiff"
      :documentId="documentId"
      :versions="versions"
      @close="showDiff = false"
    />

    <div v-if="!showDiff">
      <div v-if="versions.length === 0" class="empty">No versions yet</div>
      <div v-for="v in versions" :key="v.id" class="version-item">
        <div class="version-info">
          <span class="version-num">v{{ v.version_number }}</span>
          <span class="version-title">{{ v.title }}</span>
          <span class="version-meta">{{ v.created_by_name }} - {{ formatDate(v.created_at) }}</span>
        </div>
        <button class="btn-secondary btn-sm" @click="restoreVersion(v.id)">Restore</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { documentsApi } from '../../api/documents.js'
import VersionDiffView from './VersionDiffView.vue'

const props = defineProps({ documentId: String })
const emit = defineEmits(['restored'])
const versions = ref([])
const showDiff = ref(false)

onMounted(loadVersions)

async function loadVersions() {
  const { data } = await documentsApi.listVersions(props.documentId)
  versions.value = data
}

async function createSnapshot() {
  await documentsApi.createVersion(props.documentId)
  loadVersions()
}

async function restoreVersion(versionId) {
  if (confirm('Restore this version? Current content will be saved as a new version first.')) {
    await documentsApi.restoreVersion(props.documentId, versionId)
    emit('restored')
    loadVersions()
  }
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts + 'Z').toLocaleString()
}
</script>

<style scoped>
.version-panel {
  padding: 1rem;
}
.version-panel h3 { font-size: 0.95rem; margin-bottom: 0.75rem; }
.version-actions-top {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.empty { color: var(--gray-400); font-size: 0.85rem; }
.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid var(--gray-100);
}
.version-info { display: flex; flex-direction: column; gap: 0.15rem; }
.version-num { font-weight: 700; font-size: 0.8rem; color: var(--primary); }
.version-title { font-size: 0.85rem; }
.version-meta { font-size: 0.7rem; color: var(--gray-400); }
</style>
