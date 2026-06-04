<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>My Documents</h2>
    </div>
    <div v-if="docStore.loading" class="loading">Loading...</div>
    <div v-else-if="docStore.documents.length === 0" class="empty-state">
      <p>No documents yet. Create your first one!</p>
      <button class="btn-primary" @click="createDoc">Create Document</button>
    </div>
    <div v-else class="doc-grid">
      <DocumentCard
        v-for="doc in docStore.documents"
        :key="doc.id"
        :document="doc"
        @open="openDoc(doc.id)"
        @trash="handleTrash(doc.id)"
        @archive="handleArchive(doc.id)"
        @share="openShare(doc)"
      />
    </div>

    <ShareDialog
      v-if="shareTarget"
      :document="shareTarget"
      @close="shareTarget = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentsStore } from '../stores/documents.js'
import DocumentCard from '../components/documents/DocumentCard.vue'
import ShareDialog from '../components/documents/ShareDialog.vue'

const router = useRouter()
const docStore = useDocumentsStore()
const shareTarget = ref(null)

onMounted(() => docStore.fetchDocuments())

async function createDoc() {
  const doc = await docStore.createDocument()
  router.push(`/documents/${doc.id}`)
}

function openDoc(id) {
  router.push(`/documents/${id}`)
}

async function handleTrash(id) {
  if (confirm('Move this document to trash?')) {
    await docStore.trashDocument(id)
  }
}

async function handleArchive(id) {
  await docStore.archiveDocument(id)
}

function openShare(doc) {
  shareTarget.value = doc
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.loading { text-align: center; color: var(--gray-400); padding: 3rem; }
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--gray-500);
}
.empty-state p { margin-bottom: 1rem; }
.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
</style>
