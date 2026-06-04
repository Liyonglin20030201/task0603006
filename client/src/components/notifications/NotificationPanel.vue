<template>
  <div class="notification-panel card" v-click-outside="() => $emit('close')">
    <div class="panel-header">
      <h3>Notifications</h3>
      <button class="btn-secondary btn-sm" @click="notifStore.markAllRead()">Mark all read</button>
    </div>
    <div class="panel-body">
      <div v-if="notifStore.notifications.length === 0" class="empty">No notifications</div>
      <div
        v-for="n in notifStore.notifications"
        :key="n.id"
        class="notif-item"
        :class="{ unread: !n.read }"
        @click="handleClick(n)"
      >
        <div class="notif-title">{{ n.title }}</div>
        <div class="notif-message">{{ n.message }}</div>
        <div class="notif-time">{{ formatTime(n.created_at) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useNotificationsStore } from '../../stores/notifications.js'
import { useRouter } from 'vue-router'

const emit = defineEmits(['close'])
const notifStore = useNotificationsStore()
const router = useRouter()

function handleClick(n) {
  notifStore.markRead(n.id)
  const meta = JSON.parse(n.metadata || '{}')
  if (meta.document_id) {
    router.push(`/documents/${meta.document_id}`)
    emit('close')
  }
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts + 'Z')
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}
</script>

<style scoped>
.notification-panel {
  position: absolute;
  top: 48px;
  right: 0;
  width: 360px;
  max-height: 480px;
  overflow-y: auto;
  z-index: 200;
  box-shadow: var(--shadow-md);
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.panel-header h3 { font-size: 0.95rem; }
.empty { color: var(--gray-400); text-align: center; padding: 2rem; font-size: 0.875rem; }
.notif-item {
  padding: 0.75rem;
  border-radius: var(--radius);
  cursor: pointer;
  border-bottom: 1px solid var(--gray-100);
}
.notif-item:hover { background: var(--gray-50); }
.notif-item.unread { background: var(--primary-light); }
.notif-title { font-weight: 600; font-size: 0.8rem; margin-bottom: 0.2rem; }
.notif-message { font-size: 0.8rem; color: var(--gray-600); }
.notif-time { font-size: 0.7rem; color: var(--gray-400); margin-top: 0.25rem; }
</style>
