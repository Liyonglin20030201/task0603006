import { ref, onUnmounted } from 'vue'
import { documentsApi } from '../api/documents.js'

export function useAutoSave(documentId, getContent) {
  const saveStatus = ref('saved') // 'saved' | 'saving' | 'unsaved' | 'error'
  const retryCount = ref(0)
  const MAX_RETRIES = 5
  let saveTimer = null
  let retryTimer = null

  function scheduleSave() {
    if (saveStatus.value === 'saving') return
    saveStatus.value = 'unsaved'
    clearTimeout(saveTimer)
    saveTimer = setTimeout(save, 2000)
  }

  async function save() {
    if (!getContent) return
    const content = typeof getContent === 'function' ? getContent() : null
    if (content === null) return

    saveStatus.value = 'saving'
    try {
      await documentsApi.saveContent(documentId, {
        title: content.title,
        contentText: content.text
      })
      saveStatus.value = 'saved'
      retryCount.value = 0
    } catch (err) {
      retryCount.value++
      if (retryCount.value <= MAX_RETRIES) {
        saveStatus.value = 'unsaved'
        const delay = Math.min(1000 * Math.pow(2, retryCount.value - 1), 30000)
        retryTimer = setTimeout(save, delay)
      } else {
        saveStatus.value = 'error'
      }
    }
  }

  function forceSave() {
    clearTimeout(saveTimer)
    clearTimeout(retryTimer)
    retryCount.value = 0
    save()
  }

  function resetError() {
    retryCount.value = 0
    saveStatus.value = 'unsaved'
    save()
  }

  onUnmounted(() => {
    clearTimeout(saveTimer)
    clearTimeout(retryTimer)
  })

  return { saveStatus, retryCount, scheduleSave, forceSave, resetError }
}
