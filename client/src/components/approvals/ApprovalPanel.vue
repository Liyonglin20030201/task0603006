<template>
  <div class="approval-panel">
    <h3>Approval Status</h3>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="approvals.length === 0" class="empty">
      <p>No approval requests yet.</p>
    </div>

    <div v-else>
      <div v-for="req in approvals" :key="req.id" class="approval-item">
        <div class="approval-header">
          <span class="status-badge" :class="req.status">{{ req.status }}</span>
          <span class="approval-date">{{ formatDate(req.created_at) }}</span>
        </div>
        <p class="approval-title">{{ req.title }}</p>
        <p v-if="req.message" class="approval-msg">{{ req.message }}</p>

        <div class="reviewers-list">
          <div v-for="r in req.reviewers" :key="r.id" class="reviewer-item">
            <span class="reviewer-name">{{ r.reviewer_name }}</span>
            <span class="reviewer-decision" :class="r.decision">{{ r.decision }}</span>
          </div>
        </div>

        <button v-if="req.status === 'pending' && req.requester_id === userId" class="btn btn-sm btn-secondary" @click="cancelRequest(req.id)">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApprovalsStore } from '../../stores/approvals.js'
import { useAuthStore } from '../../stores/auth.js'

const props = defineProps({ documentId: String })

const approvalsStore = useApprovalsStore()
const authStore = useAuthStore()
const approvals = ref([])
const loading = ref(true)
const userId = authStore.user?.id

onMounted(async () => {
  try {
    approvals.value = await approvalsStore.fetchByDocument(props.documentId)
  } finally {
    loading.value = false
  }
})

async function cancelRequest(requestId) {
  if (confirm('Cancel this approval request?')) {
    await approvalsStore.cancelRequest(requestId)
    approvals.value = await approvalsStore.fetchByDocument(props.documentId)
  }
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts + 'Z').toLocaleString()
}
</script>

<style scoped>
.approval-panel {
  padding: 1rem;
}
.approval-panel h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}
.approval-item {
  padding: 0.75rem;
  border-bottom: 1px solid var(--gray-100);
}
.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}
.status-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-weight: 600;
  text-transform: capitalize;
}
.status-badge.pending { background: #fef3c7; color: #d97706; }
.status-badge.approved { background: #dcfce7; color: #16a34a; }
.status-badge.rejected { background: #fee2e2; color: #dc2626; }
.status-badge.cancelled { background: var(--gray-100); color: var(--gray-500); }
.approval-date { font-size: 0.7rem; color: var(--gray-400); }
.approval-title { font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem; }
.approval-msg { font-size: 0.8rem; color: var(--gray-500); font-style: italic; }
.reviewers-list { margin-top: 0.5rem; }
.reviewer-item {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.8rem;
}
.reviewer-name { color: var(--gray-700); }
.reviewer-decision { font-weight: 500; text-transform: capitalize; }
.reviewer-decision.approved { color: #16a34a; }
.reviewer-decision.rejected { color: #dc2626; }
.reviewer-decision.pending { color: #d97706; }
.btn-sm { font-size: 0.75rem; padding: 0.3rem 0.5rem; margin-top: 0.5rem; }
.btn-secondary { background: var(--gray-100); color: var(--gray-700); border: none; border-radius: var(--radius); cursor: pointer; }
.btn-secondary:hover { background: var(--gray-200); }
.loading, .empty { font-size: 0.85rem; color: var(--gray-400); padding: 0.5rem 0; }
</style>
