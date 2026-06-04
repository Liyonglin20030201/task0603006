<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog card">
      <h3>Share "{{ document.title }}"</h3>
      <form @submit.prevent="handleShare" class="share-form">
        <input v-model="email" type="email" placeholder="User email" required />
        <select v-model="permission">
          <option value="view">View</option>
          <option value="comment">Comment</option>
          <option value="edit">Edit</option>
        </select>
        <button type="submit" class="btn-primary btn-sm">Share</button>
      </form>
      <p v-if="error" class="error-text">{{ error }}</p>
      <p v-if="success" class="success-text">{{ success }}</p>

      <div class="share-list" v-if="shares.length">
        <h4>People with access</h4>
        <div v-for="s in shares" :key="s.id" class="share-item">
          <span class="share-name">{{ s.display_name }} ({{ s.email }})</span>
          <select :value="s.permission" @change="updatePermission(s.id, $event.target.value)">
            <option value="view">View</option>
            <option value="comment">Comment</option>
            <option value="edit">Edit</option>
          </select>
          <button class="btn-secondary btn-sm" @click="revokeAccess(s.id)">Revoke</button>
        </div>
      </div>

      <button class="btn-secondary close-btn" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { documentsApi } from '../../api/documents.js'

const props = defineProps({ document: Object })
const emit = defineEmits(['close'])

const email = ref('')
const permission = ref('edit')
const shares = ref([])
const error = ref('')
const success = ref('')

onMounted(loadShares)

async function loadShares() {
  const { data } = await documentsApi.listShares(props.document.id)
  shares.value = data
}

async function handleShare() {
  error.value = ''
  success.value = ''
  try {
    await documentsApi.share(props.document.id, { email: email.value, permission: permission.value })
    success.value = `Shared with ${email.value}`
    email.value = ''
    loadShares()
  } catch (err) {
    error.value = err.response?.data?.error || 'Share failed'
  }
}

async function updatePermission(shareId, perm) {
  await documentsApi.updateShare(props.document.id, shareId, perm)
  loadShares()
}

async function revokeAccess(shareId) {
  await documentsApi.revokeShare(props.document.id, shareId)
  loadShares()
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
}
.dialog { width: 100%; max-width: 500px; }
.dialog h3 { margin-bottom: 1rem; }
.share-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.share-form input { flex: 1; }
.share-form select { width: auto; }
.error-text { color: var(--danger); font-size: 0.8rem; }
.success-text { color: var(--success); font-size: 0.8rem; }
.share-list { margin-top: 1.5rem; }
.share-list h4 { font-size: 0.85rem; margin-bottom: 0.75rem; color: var(--gray-600); }
.share-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--gray-100);
}
.share-name { flex: 1; font-size: 0.85rem; }
.share-item select { width: auto; padding: 0.3rem; font-size: 0.8rem; }
.close-btn { margin-top: 1rem; width: 100%; }
</style>
