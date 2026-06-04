<template>
  <header class="app-header">
    <div class="header-left">
      <h1 class="logo" @click="$router.push('/')">CollabDocs</h1>
    </div>
    <div class="header-center">
      <div class="search-box" @click="$router.push('/search')">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <span>Search documents...</span>
      </div>
    </div>
    <div class="header-right">
      <div class="notification-btn" @click="showNotifications = !showNotifications">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span v-if="notifStore.unreadCount" class="badge-count">{{ notifStore.unreadCount }}</span>
      </div>
      <NotificationPanel v-if="showNotifications" @close="showNotifications = false" />
      <div class="user-menu">
        <span class="user-name">{{ authStore.user?.display_name }}</span>
        <button class="btn-secondary btn-sm" @click="handleLogout">Logout</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import { useNotificationsStore } from '../../stores/notifications.js'
import NotificationPanel from '../notifications/NotificationPanel.vue'

const router = useRouter()
const authStore = useAuthStore()
const notifStore = useNotificationsStore()
const showNotifications = ref(false)

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 56px;
  background: white;
  border-bottom: 1px solid var(--gray-200);
  position: relative;
  z-index: 100;
}
.logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
  cursor: pointer;
}
.header-center { flex: 1; max-width: 400px; margin: 0 2rem; }
.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--gray-100);
  border-radius: var(--radius);
  color: var(--gray-400);
  cursor: pointer;
  font-size: 0.875rem;
}
.search-box:hover { background: var(--gray-200); }
.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}
.notification-btn {
  position: relative;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  color: var(--gray-600);
}
.notification-btn:hover { background: var(--gray-100); }
.badge-count {
  position: absolute;
  top: 0; right: 0;
  background: var(--danger);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  width: 16px; height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-700);
}
</style>
