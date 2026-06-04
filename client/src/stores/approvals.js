import { ref } from 'vue'
import { defineStore } from 'pinia'
import { approvalsApi } from '../api/approvals.js'

export const useApprovalsStore = defineStore('approvals', () => {
  const pendingApprovals = ref([])
  const documentApprovals = ref([])
  const loading = ref(false)

  async function fetchPending() {
    loading.value = true
    try {
      const { data } = await approvalsApi.listPending()
      pendingApprovals.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchByDocument(docId) {
    const { data } = await approvalsApi.listByDocument(docId)
    documentApprovals.value = data
    return data
  }

  async function submitApproval(docId, formData) {
    const { data } = await approvalsApi.submit(docId, formData)
    return data
  }

  async function approveRequest(requestId, comment) {
    const { data } = await approvalsApi.approve(requestId, comment)
    pendingApprovals.value = pendingApprovals.value.filter(a => a.id !== requestId)
    return data
  }

  async function rejectRequest(requestId, comment) {
    const { data } = await approvalsApi.reject(requestId, comment)
    pendingApprovals.value = pendingApprovals.value.filter(a => a.id !== requestId)
    return data
  }

  async function cancelRequest(requestId) {
    const { data } = await approvalsApi.cancel(requestId)
    return data
  }

  return { pendingApprovals, documentApprovals, loading, fetchPending, fetchByDocument, submitApproval, approveRequest, rejectRequest, cancelRequest }
})
