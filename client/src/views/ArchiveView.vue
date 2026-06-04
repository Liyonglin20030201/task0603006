<template>
  <div class="archive-view">
    <div class="page-header">
      <h2>Archived Documents</h2>
      <p class="hint">Archived documents are kept indefinitely but hidden from your main list</p>
    </div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="docStore.documents.length === 0" class="empty-state">
      <p>No archived documents</p>
    </div>
    <div v-else class="archive-list">
      <div v-for="doc in docStore.documents" :key="doc.id" class="archive-item card">
        <div class="item-info">
          <h4>{{ doc.title }}</h4>
          <span class="meta">Archived {{ formatDate(doc.updated_at) }}</span>
        </div>
        <div class="item-actions">
          <button class="btn-primary btn-sm" @click="handleUnarchive(doc.id)">Unarchive</button>
          <button class="btn-danger btn-sm" @click="handleTrash(doc.id)">Trash</button>
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
  await docStore.fetchDocuments('archived')
  loading.value = false
})

async function handleUnarchive(id) {
  await docStore.unarchiveDocument(id)
}

async function handleTrash(id) {
  if (confirm('Move this archived document to trash?')) {
    await docStore.trashDocument(id)
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
.archive-list { display: flex; flex-direction: column; gap: 0.75rem; }
.archive-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.item-info h4 { font-size: 0.95rem; }
.meta { font-size: 0.75rem; color: var(--gray-400); }
.item-actions { display: flex; gap: 0.5rem; }
</style>
