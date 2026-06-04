<template>
  <div class="trash-view">
    <div class="page-header">
      <h2>Trash</h2>
      <p class="hint">Documents in trash are automatically deleted after 30 days</p>
    </div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="docStore.documents.length === 0" class="empty-state">
      <p>Trash is empty</p>
    </div>
    <div v-else class="trash-list">
      <div v-for="doc in docStore.documents" :key="doc.id" class="trash-item card">
        <div class="item-info">
          <h4>{{ doc.title }}</h4>
          <span class="meta">Trashed {{ formatDate(doc.trashed_at) }}</span>
        </div>
        <div class="item-actions">
          <button class="btn-primary btn-sm" @click="handleRestore(doc.id)">Restore</button>
          <button class="btn-danger btn-sm" @click="handleDelete(doc.id)">Delete Forever</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDocumentsStore } from '../stores/documents.js'

const docStore = useDocumentsStore()
const loading = ref(true)

onMounted(async () => {
  await docStore.fetchDocuments('trashed')
  loading.value = false
})

async function handleRestore(id) {
  await docStore.restoreDocument(id)
}

async function handleDelete(id) {
  if (confirm('Permanently delete this document? This cannot be undone.')) {
    await docStore.permanentDelete(id)
  }
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts + 'Z').toLocaleDateString()
}
</script>

<style scoped>
.page-header { margin-bottom: 1.5rem; }
.page-header h2 { margin-bottom: 0.25rem; }
.hint { font-size: 0.8rem; color: var(--gray-400); }
.loading, .empty-state { text-align: center; padding: 3rem; color: var(--gray-400); }
.trash-list { display: flex; flex-direction: column; gap: 0.75rem; }
.trash-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.item-info h4 { font-size: 0.95rem; }
.meta { font-size: 0.75rem; color: var(--gray-400); }
.item-actions { display: flex; gap: 0.5rem; }
</style>
