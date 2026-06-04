<template>
  <div class="comment-sidebar">
    <div class="sidebar-header">
      <h3>Comments</h3>
    </div>

    <div class="comment-form" v-if="canComment">
      <textarea v-model="newComment" placeholder="Add a comment..." rows="3"></textarea>
      <button class="btn-primary btn-sm" @click="addComment" :disabled="!newComment.trim()">Post</button>
    </div>

    <div class="comments-list">
      <div v-if="comments.length === 0" class="empty">No comments yet</div>
      <div v-for="c in rootComments" :key="c.id" class="comment-thread">
        <div class="comment-item">
          <div class="comment-header">
            <span class="comment-author">{{ c.display_name }}</span>
            <span class="comment-time">{{ formatTime(c.created_at) }}</span>
          </div>
          <p class="comment-text">{{ c.content }}</p>
          <div class="comment-actions">
            <button v-if="!c.resolved" class="btn-sm" @click="resolve(c.id)">Resolve</button>
            <button class="btn-sm" @click="replyTo = c.id">Reply</button>
          </div>
          <div v-if="c.resolved" class="resolved-badge">Resolved</div>
        </div>

        <!-- Replies -->
        <div v-for="r in getReplies(c.id)" :key="r.id" class="comment-item reply">
          <div class="comment-header">
            <span class="comment-author">{{ r.display_name }}</span>
            <span class="comment-time">{{ formatTime(r.created_at) }}</span>
          </div>
          <p class="comment-text">{{ r.content }}</p>
        </div>

        <!-- Reply form -->
        <div v-if="replyTo === c.id" class="reply-form">
          <textarea v-model="replyContent" placeholder="Reply..." rows="2"></textarea>
          <div class="reply-actions">
            <button class="btn-primary btn-sm" @click="postReply(c.id)">Reply</button>
            <button class="btn-secondary btn-sm" @click="replyTo = null">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { documentsApi } from '../../api/documents.js'

const props = defineProps({
  documentId: String,
  canComment: { type: Boolean, default: true }
})

const comments = ref([])
const newComment = ref('')
const replyTo = ref(null)
const replyContent = ref('')

const rootComments = computed(() => comments.value.filter(c => !c.parent_id))

function getReplies(parentId) {
  return comments.value.filter(c => c.parent_id === parentId)
}

onMounted(loadComments)

async function loadComments() {
  const { data } = await documentsApi.listComments(props.documentId)
  comments.value = data
}

async function addComment() {
  if (!newComment.value.trim()) return
  await documentsApi.createComment(props.documentId, { content: newComment.value })
  newComment.value = ''
  loadComments()
}

async function postReply(parentId) {
  if (!replyContent.value.trim()) return
  await documentsApi.createComment(props.documentId, { content: replyContent.value, parentId })
  replyContent.value = ''
  replyTo.value = null
  loadComments()
}

async function resolve(commentId) {
  await documentsApi.resolveComment(commentId)
  loadComments()
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
.comment-sidebar {
  width: 320px;
  border-left: 1px solid var(--gray-200);
  background: white;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--gray-100);
}
.sidebar-header h3 { font-size: 0.95rem; }
.comment-form {
  padding: 1rem;
  border-bottom: 1px solid var(--gray-100);
}
.comment-form textarea {
  width: 100%;
  resize: none;
  margin-bottom: 0.5rem;
}
.comments-list { flex: 1; overflow-y: auto; }
.empty { padding: 2rem; text-align: center; color: var(--gray-400); font-size: 0.85rem; }
.comment-thread {
  border-bottom: 1px solid var(--gray-100);
}
.comment-item {
  padding: 0.75rem 1rem;
}
.comment-item.reply {
  padding-left: 2rem;
  background: var(--gray-50);
}
.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.3rem;
}
.comment-author { font-size: 0.8rem; font-weight: 600; }
.comment-time { font-size: 0.7rem; color: var(--gray-400); }
.comment-text { font-size: 0.85rem; color: var(--gray-700); }
.comment-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.4rem;
}
.comment-actions button { background: transparent; color: var(--primary); padding: 0; font-size: 0.75rem; }
.resolved-badge {
  font-size: 0.7rem;
  color: var(--success);
  font-weight: 600;
  margin-top: 0.3rem;
}
.reply-form { padding: 0.5rem 1rem 0.75rem 2rem; }
.reply-form textarea { width: 100%; resize: none; margin-bottom: 0.4rem; }
.reply-actions { display: flex; gap: 0.5rem; }
</style>
