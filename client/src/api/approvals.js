import client from './client.js'

export const approvalsApi = {
  submit(docId, data) { return client.post(`/documents/${docId}/approvals`, data) },
  listByDocument(docId) { return client.get(`/documents/${docId}/approvals`) },
  listPending() { return client.get('/approvals/pending') },
  getRequest(requestId) { return client.get(`/approvals/${requestId}`) },
  approve(requestId, comment) { return client.post(`/approvals/${requestId}/approve`, { comment }) },
  reject(requestId, comment) { return client.post(`/approvals/${requestId}/reject`, { comment }) },
  cancel(requestId) { return client.post(`/approvals/${requestId}/cancel`) }
}
