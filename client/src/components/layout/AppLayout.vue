<template>
  <div class="app-layout">
    <AppHeader />
    <div class="layout-body">
      <AppSidebar />
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import { useNotificationsStore } from '../../stores/notifications.js'
import { onMounted } from 'vue'

const notifStore = useNotificationsStore()
onMounted(() => notifStore.fetch())
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.layout-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}
</style>
