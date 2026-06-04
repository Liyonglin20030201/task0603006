<template>
  <div class="doc-card card" @click="$emit('open')">
    <div class="card-header">
      <h3 class="doc-title">{{ document.title }}</h3>
      <span :class="['badge', `badge-${permissionLabel}`]">{{ permissionLabel }}</span>
    </div>
    <p class="doc-meta">
      <span v-if="document.owner_name">by {{ document.owner_name }}</span>
      <span>{{ formatDate(document.updated_at) }}</span>
    </p>
    <div class="card-actions" @click.stop>
      <button class="btn-secondary btn-sm" @click="$emit('share')" v-if="isOwner">Share</button>
      <button class="btn-secondary btn-sm" @click="$emit('archive')" v-if="isOwner">Archive</button>
      <button class="btn-secondary btn-sm btn-danger-text" @click="$emit('trash')" v-if="isOwner">Trash</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth.js'

const props = defineProps({ document: Object })
defineEmits(['open', 'trash', 'share', 'archive'])

const authStore = useAuthStore()
const isOwner = computed(() => props.document.owner_id === authStore.user?.id)
const permissionLabel = computed(() => {
  if (isOwner.value) return 'owner'
  return props.document.my_permission || 'view'
})

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts + 'Z')
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.doc-card {
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
}
.doc-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}
.doc-title {
  font-size: 0.95rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 0.5rem;
}
.doc-meta {
  font-size: 0.75rem;
  color: var(--gray-400);
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.card-actions {
  display: flex;
  gap: 0.5rem;
}
.btn-danger-text { color: var(--danger); }
</style>
