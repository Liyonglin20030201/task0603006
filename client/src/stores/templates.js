import { ref } from 'vue'
import { defineStore } from 'pinia'
import { templatesApi } from '../api/templates.js'

export const useTemplatesStore = defineStore('templates', () => {
  const templates = ref([])
  const loading = ref(false)

  async function fetchTemplates(category) {
    loading.value = true
    try {
      const { data } = await templatesApi.list(category)
      templates.value = data
    } finally {
      loading.value = false
    }
  }

  async function createTemplate(templateData) {
    const { data } = await templatesApi.create(templateData)
    templates.value.unshift(data)
    return data
  }

  async function createFromDocument(docId, templateData) {
    const { data } = await templatesApi.createFromDocument(docId, templateData)
    templates.value.unshift(data)
    return data
  }

  async function deleteTemplate(id) {
    await templatesApi.remove(id)
    templates.value = templates.value.filter(t => t.id !== id)
  }

  async function createDocFromTemplate(templateId, title) {
    const { data } = await templatesApi.createDocFromTemplate(templateId, title)
    return data
  }

  return { templates, loading, fetchTemplates, createTemplate, createFromDocument, deleteTemplate, createDocFromTemplate }
})
