<template>
  <div class="document-view" v-if="doc">
    <div class="doc-header">
      <div class="doc-header-left">
        <button class="btn-secondary btn-sm" @click="$router.push('/')">← Back</button>
        <input
          class="title-input"
          v-model="docTitle"
          @input="onTitleInput"
          :disabled="!canEdit"
        />
      </div>
      <div class="doc-header-right">
        <div class="save-status" :class="saveStatus">
          <span v-if="saveStatus === 'saved'" class="status-text">Saved</span>
          <span v-else-if="saveStatus === 'saving'" class="status-text">Saving...</span>
          <span v-else-if="saveStatus === 'unsaved'" class="status-text">Unsaved</span>
          <span v-else-if="saveStatus === 'error'" class="status-text">
            Save failed
            <button class="retry-btn" @click="resetError">Retry</button>
          </span>
        </div>
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
        <div class="export-btn-wrapper">
          <button class="btn-secondary btn-sm" @click="showExport = !showExport">Export</button>
          <ExportMenu
            :visible="showExport"
            :exporting="exporting"
            @close="showExport = false"
            @export="handleExport"
          />
        </div>
        <button class="btn-secondary btn-sm" @click="showVersions = !showVersions">Versions</button>
        <button class="btn-secondary btn-sm" @click="showComments = !showComments">Comments</button>
        <button v-if="isOwner" class="btn-secondary btn-sm" @click="showShare = true">Share</button>
        <button v-if="isOwner" class="btn-secondary btn-sm" @click="showApproval = !showApproval">Approval</button>
        <button v-if="isOwner" class="btn-secondary btn-sm" @click="showSubmitApproval = true">Submit</button>
        <button class="btn-secondary btn-sm" @click="showSaveTemplate = true">Save Template</button>
      </div>
    </div>

    <div class="doc-body">
      <div class="editor-area">
        <DocumentEditor
          v-if="ydoc"
          ref="editorRef"
          :ydoc="ydoc"
          :provider="wsProvider"
          :awareness="awareness"
          :documentId="doc.id"
          :readOnly="!canEdit"
          @update="onEditorUpdate"
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

      <div v-if="showApproval" class="approval-panel-wrapper">
        <ApprovalPanel :documentId="doc.id" />
      </div>
    </div>

    <ShareDialog v-if="showShare" :document="doc" @close="showShare = false" />
    <SaveAsTemplateDialog
      :visible="showSaveTemplate"
      :documentId="doc.id"
      @close="showSaveTemplate = false"
      @saved="showSaveTemplate = false"
    />
    <SubmitApprovalDialog
      :visible="showSubmitApproval"
      :documentId="doc.id"
      :documentTitle="docTitle"
      @close="showSubmitApproval = false"
      @submitted="onApprovalSubmitted"
    />
  </div>
  <div v-else class="loading">Loading document...</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDocumentsStore } from '../stores/documents.js'
import { useAuthStore } from '../stores/auth.js'
import { useCollaboration } from '../composables/useCollaboration.js'
import { useAutoSave } from '../composables/useAutoSave.js'
import { useExport } from '../composables/useExport.js'
import DocumentEditor from '../components/editor/DocumentEditor.vue'
import CommentSidebar from '../components/editor/CommentSidebar.vue'
import ExportMenu from '../components/editor/ExportMenu.vue'
import VersionHistory from '../components/documents/VersionHistory.vue'
import ShareDialog from '../components/documents/ShareDialog.vue'
import SaveAsTemplateDialog from '../components/templates/SaveAsTemplateDialog.vue'
import SubmitApprovalDialog from '../components/approvals/SubmitApprovalDialog.vue'
import ApprovalPanel from '../components/approvals/ApprovalPanel.vue'

const route = useRoute()
const router = useRouter()
const docStore = useDocumentsStore()
const authStore = useAuthStore()

const doc = ref(null)
const docTitle = ref('')
const showComments = ref(false)
const showVersions = ref(false)
const showShare = ref(false)
const showExport = ref(false)
const showApproval = ref(false)
const showSubmitApproval = ref(false)
const showSaveTemplate = ref(false)
const editorRef = ref(null)

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

const { exporting, exportHtml, exportText, exportMarkdown, exportPdf } = useExport(editorRef, docTitle)

function handleExport(format) {
  switch (format) {
    case 'html': exportHtml(); break
    case 'text': exportText(); break
    case 'markdown': exportMarkdown(); break
    case 'pdf': exportPdf(); break
  }
}

// Auto-save: getContent extracts current title and editor plain text
const { saveStatus, retryCount, scheduleSave, forceSave, resetError } = useAutoSave(
  route.params.id,
  () => {
    const text = editorRef.value?.getTextContent?.() || ''
    return { title: docTitle.value || 'Untitled', text }
  }
)

function onEditorUpdate() {
  if (canEdit.value) {
    scheduleSave()
  }
}

function onTitleInput() {
  if (canEdit.value) {
    scheduleSave()
  }
}

function onApprovalSubmitted() {
  showSubmitApproval.value = false
  showApproval.value = true
}

let statusInterval = null

onMounted(async () => {
  try {
    doc.value = await docStore.fetchDocument(route.params.id)
    docTitle.value = doc.value.title

    collaboration = useCollaboration(route.params.id)
    ydoc.value = collaboration.ydoc
    wsProvider.value = collaboration.wsProvider
    awareness.value = collaboration.awareness

    statusInterval = setInterval(() => {
      isConnected.value = collaboration.isConnected.value
      connectedUsers.value = collaboration.connectedUsers.value
    }, 1000)
  } catch (err) {
    router.push('/')
  }
})

onUnmounted(() => {
  if (statusInterval) clearInterval(statusInterval)
})

function handleVersionRestore() {
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
  gap: 0.5rem;
  flex-wrap: wrap;
}
.save-status {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}
.save-status.saved { color: var(--success); }
.save-status.saving { color: var(--warning); }
.save-status.unsaved { color: var(--gray-400); }
.save-status.error { color: var(--danger); }
.retry-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  padding: 0 0.25rem;
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
.export-btn-wrapper {
  position: relative;
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
.approval-panel-wrapper {
  width: 320px;
  border-left: 1px solid var(--gray-200);
  background: white;
  overflow-y: auto;
}
.loading { text-align: center; padding: 3rem; color: var(--gray-400); }
</style>
