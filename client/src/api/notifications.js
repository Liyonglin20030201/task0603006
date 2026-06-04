import client from './client.js'

export const notificationsApi = {
  list(params = {}) { return client.get('/notifications', { params }) },
  markRead(id) { return client.put(`/notifications/${id}/read`) },
  markAllRead() { return client.put('/notifications/read-all') },
  dismiss(id) { return client.delete(`/notifications/${id}`) }
}

export const searchApi = {
  search(q, params = {}) { return client.get('/search', { params: { q, ...params } }) }
}
