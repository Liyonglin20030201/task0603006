import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationsApi } from '../api/notifications.js'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  const unreadCount = ref(0)

  async function fetch() {
    const { data } = await notificationsApi.list({ unread: false })
    notifications.value = data.notifications
    unreadCount.value = data.unreadCount
  }

  async function markRead(id) {
    await notificationsApi.markRead(id)
    const n = notifications.value.find(x => x.id === id)
    if (n) n.read = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }

  async function markAllRead() {
    await notificationsApi.markAllRead()
    notifications.value.forEach(n => n.read = 1)
    unreadCount.value = 0
  }

  async function dismiss(id) {
    await notificationsApi.dismiss(id)
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return { notifications, unreadCount, fetch, markRead, markAllRead, dismiss }
})
