import { defineStore } from 'pinia'
import { ref } from 'vue'
import { documentsApi } from '../api/documents.js'

export const useDocumentsStore = defineStore('documents', () => {
  const documents = ref([])
  const currentDoc = ref(null)
  const loading = ref(false)

  async function fetchDocuments(status = 'active') {
    loading.value = true
    try {
      const { data } = await documentsApi.list(status)
      documents.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchDocument(id) {
    const { data } = await documentsApi.get(id)
    currentDoc.value = data
    return data
  }

  async function createDocument(title) {
    const { data } = await documentsApi.create(title || 'Untitled')
    documents.value.unshift(data)
    return data
  }

  async function updateTitle(id, title) {
    const { data } = await documentsApi.updateTitle(id, title)
    const idx = documents.value.findIndex(d => d.id === id)
    if (idx !== -1) documents.value[idx] = data
    if (currentDoc.value?.id === id) currentDoc.value = data
    return data
  }

  async function trashDocument(id) {
    await documentsApi.trash(id)
    documents.value = documents.value.filter(d => d.id !== id)
  }

  async function archiveDocument(id) {
    await documentsApi.archive(id)
    documents.value = documents.value.filter(d => d.id !== id)
  }

  async function unarchiveDocument(id) {
    await documentsApi.unarchive(id)
    documents.value = documents.value.filter(d => d.id !== id)
  }

  async function restoreDocument(id) {
    await documentsApi.restore(id)
    documents.value = documents.value.filter(d => d.id !== id)
  }

  async function permanentDelete(id) {
    await documentsApi.permanentDelete(id)
    documents.value = documents.value.filter(d => d.id !== id)
  }

  return {
    documents, currentDoc, loading,
    fetchDocuments, fetchDocument, createDocument, updateTitle,
    trashDocument, archiveDocument, unarchiveDocument, restoreDocument, permanentDelete
  }
})
