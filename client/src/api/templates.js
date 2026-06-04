import client from './client.js'

export const templatesApi = {
  list(category) { return client.get('/templates', { params: { category } }) },
  get(id) { return client.get(`/templates/${id}`) },
  create(data) { return client.post('/templates', data) },
  createFromDocument(docId, data) { return client.post(`/templates/from-document/${docId}`, data) },
  update(id, data) { return client.put(`/templates/${id}`, data) },
  remove(id) { return client.delete(`/templates/${id}`) },
  createDocFromTemplate(templateId, title) { return client.post(`/templates/create-document/${templateId}`, { title }) }
}
