<template>
  <div class="document-view" v-if="doc">
    <div class="doc-header">
      <div class="doc-header-left">
        <button class="btn-secondary btn-sm" @click="$router.push('/')">← Back</button>
        <input
          class="title-input"
          :value="doc.title"
          @change="handleTitleChange"
          :disabled="!canEdit"
        />
      </div>
      <div class="doc-header-right">
        <div class="connection-status">
          <span class="status-dot" :class="{ connected: isConnected }"></span>
          {{ isConnected ? 'Connected' : 'Offline' }}
        </div>
        <div class="collab-users" v-if="connectedUsers.length">
          <span
            v-for="(u, i) in connectedUsers"
            :key="i"
            class="user-avatar"
            :style="{ background: u.color }"
            :title="u.name"
          >{{ u.name?.charAt(0) }}</span>
        </div>
        <button class="btn-secondary btn-sm" @click="showVersions = !showVersions">Versions</button>
        <button class="btn-secondary btn-sm" @click="showComments = !showComments">Comments</button>
        <button v-if="isOwner" class="btn-secondary btn-sm" @click="showShare = true">Share</button>
      </div>
    </div>

    <div class="doc-body">
      <div class="editor-area">
        <DocumentEditor
          v-if="ydoc"
          :ydoc="ydoc"
          :provider="wsProvider"
          :awareness="awareness"
          :readOnly="!canEdit"
        />
      </div>

      <CommentSidebar
        v-if="showComments"
        :documentId="doc.id"
        :canComment="canComment"
      />

      <div v-if="showVersions" class="version-panel-wrapper">
        <VersionHistory :documentId="doc.id" @restored="handleVersionRestore" />
      </div>
    </div>

    <ShareDialog v-if="showShare" :document="doc" @close="showShare = false" />
  </div>
  <div v-else class="loading">Loading document...</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDocumentsStore } from '../stores/documents.js'
import { useAuthStore } from '../stores/auth.js'
import { useCollaboration } from '../composables/useCollaboration.js'
import DocumentEditor from '../components/editor/DocumentEditor.vue'
import CommentSidebar from '../components/editor/CommentSidebar.vue'
import VersionHistory from '../components/documents/VersionHistory.vue'
import ShareDialog from '../components/documents/ShareDialog.vue'

const route = useRoute()
const router = useRouter()
const docStore = useDocumentsStore()
const authStore = useAuthStore()

const doc = ref(null)
const showComments = ref(false)
const showVersions = ref(false)
const showShare = ref(false)

const isOwner = computed(() => doc.value?.owner_id === authStore.user?.id)
const canEdit = computed(() => {
  if (isOwner.value) return true
  return doc.value?.my_permission === 'edit'
})
const canComment = computed(() => {
  if (isOwner.value) return true
  return ['comment', 'edit'].includes(doc.value?.my_permission)
})

let collaboration = null
const ydoc = ref(null)
const wsProvider = ref(null)
const awareness = ref(null)
const isConnected = ref(false)
const connectedUsers = ref([])

onMounted(async () => {
  try {
    doc.value = await docStore.fetchDocument(route.params.id)
    collaboration = useCollaboration(route.params.id)
    ydoc.value = collaboration.ydoc
    wsProvider.value = collaboration.wsProvider
    awareness.value = collaboration.awareness
    isConnected.value = collaboration.isConnected
    connectedUsers.value = collaboration.connectedUsers

    // Watch reactive refs from composable
    const stop1 = setInterval(() => {
      isConnected.value = collaboration.isConnected.value
      connectedUsers.value = collaboration.connectedUsers.value
    }, 1000)

    // Clean up on unmount handled by composable's onUnmounted
  } catch (err) {
    router.push('/')
  }
})

async function handleTitleChange(e) {
  const newTitle = e.target.value.trim()
  if (newTitle && newTitle !== doc.value.title) {
    await docStore.updateTitle(doc.value.id, newTitle)
    doc.value.title = newTitle
  }
}

function handleVersionRestore() {
  // Reload the page to get fresh Yjs state
  window.location.reload()
}
</script>

<style scoped>
.document-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  margin: -1.5rem;
}
.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: white;
  border-bottom: 1px solid var(--gray-200);
}
.doc-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}
.title-input {
  border: none;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0.4rem 0.5rem;
  border-radius: var(--radius);
  flex: 1;
  max-width: 400px;
}
.title-input:hover:not(:disabled) { background: var(--gray-100); }
.title-input:focus { background: var(--gray-100); box-shadow: none; }
.doc-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.connection-status {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--gray-500);
}
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--gray-300);
}
.status-dot.connected { background: var(--success); }
.collab-users {
  display: flex;
  gap: -4px;
}
.user-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  border: 2px solid white;
  margin-left: -4px;
}
.doc-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.editor-area { flex: 1; overflow-y: auto; background: white; }
.version-panel-wrapper {
  width: 320px;
  border-left: 1px solid var(--gray-200);
  background: white;
  overflow-y: auto;
}
.loading { text-align: center; padding: 3rem; color: var(--gray-400); }
</style>
