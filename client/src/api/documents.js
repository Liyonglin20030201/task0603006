import client from './client.js'

export const documentsApi = {
  list(status = 'active') { return client.get('/documents', { params: { status } }) },
  get(id) { return client.get(`/documents/${id}`) },
  create(title) { return client.post('/documents', { title }) },
  updateTitle(id, title) { return client.put(`/documents/${id}`, { title }) },
  saveContent(id, { title, contentText }) { return client.put(`/documents/${id}/save`, { title, contentText }) },
  trash(id) { return client.delete(`/documents/${id}`) },
  archive(id) { return client.post(`/documents/${id}/archive`) },
  unarchive(id) { return client.post(`/documents/${id}/unarchive`) },
  restore(id) { return client.post(`/documents/${id}/restore`) },
  permanentDelete(id) { return client.delete(`/documents/${id}/permanent`) },

  // Versions
  listVersions(id) { return client.get(`/documents/${id}/versions`) },
  createVersion(id) { return client.post(`/documents/${id}/versions`) },
  getVersion(id, versionId) { return client.get(`/documents/${id}/versions/${versionId}`) },
  restoreVersion(id, versionId) { return client.post(`/documents/${id}/versions/${versionId}/restore`) },
  compareVersions(docId, versionIdA, versionIdB) { return client.get(`/documents/${docId}/versions/compare`, { params: { a: versionIdA, b: versionIdB } }) },

  // Shares
  listShares(id) { return client.get(`/documents/${id}/shares`) },
  share(id, data) { return client.post(`/documents/${id}/shares`, data) },
  updateShare(id, shareId, permission) { return client.put(`/documents/${id}/shares/${shareId}`, { permission }) },
  revokeShare(id, shareId) { return client.delete(`/documents/${id}/shares/${shareId}`) },

  // Comments
  listComments(id) { return client.get(`/documents/${id}/comments`) },
  createComment(id, data) { return client.post(`/documents/${id}/comments`, data) },
  updateComment(commentId, content) { return client.put(`/documents/comments/${commentId}`, { content }) },
  deleteComment(commentId) { return client.delete(`/documents/comments/${commentId}`) },
  resolveComment(commentId) { return client.post(`/documents/comments/${commentId}/resolve`) }
}
