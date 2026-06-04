<template>
  <div class="approvals-page">
    <header class="page-header">
      <h1>Pending Approvals</h1>
    </header>

    <div v-if="loading" class="loading-state">Loading...</div>

    <div v-else-if="approvals.length === 0" class="empty-state">
      <p>No pending approvals.</p>
    </div>

    <div v-else class="approvals-list">
      <div v-for="item in approvals" :key="item.id" class="approval-card">
        <div class="approval-info">
          <h3>{{ item.document_title }}</h3>
          <p class="approval-meta">Requested by {{ item.requester_name }} · {{ formatDate(item.created_at) }}</p>
          <p v-if="item.message" class="approval-message">{{ item.message }}</p>
        </div>
        <div class="approval-actions">
          <button class="btn btn-success" @click="handleApprove(item)">Approve</button>
          <button class="btn btn-danger" @click="handleReject(item)">Reject</button>
          <router-link :to="`/documents/${item.document_id}`" class="btn btn-secondary">View Doc</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useApprovalsStore } from '../stores/approvals.js'

const approvalsStore = useApprovalsStore()
const loading = computed(() => approvalsStore.loading)
const approvals = computed(() => approvalsStore.pendingApprovals)

onMounted(() => {
  approvalsStore.fetchPending()
})

async function handleApprove(item) {
  const comment = prompt('Add a comment (optional):') || ''
  await approvalsStore.approveRequest(item.id, comment)
}

async function handleReject(item) {
  const comment = prompt('Reason for rejection:') || ''
  await approvalsStore.rejectRequest(item.id, comment)
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts + 'Z').toLocaleString()
}
</script>

<style scoped>
.approvals-page {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}
.page-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 1.5rem;
}
.approvals-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.approval-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.approval-card:hover {
  border-color: var(--primary);
}
.approval-info h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.approval-meta {
  font-size: 0.8rem;
  color: var(--gray-500);
}
.approval-message {
  font-size: 0.85rem;
  color: var(--gray-600);
  margin-top: 0.5rem;
  font-style: italic;
}
.approval-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
.btn {
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  text-decoration: none;
}
.btn-success { background: #dcfce7; color: #16a34a; }
.btn-success:hover { background: #bbf7d0; }
.btn-danger { background: #fee2e2; color: #dc2626; }
.btn-danger:hover { background: #fecaca; }
.btn-secondary { background: var(--gray-100); color: var(--gray-700); }
.btn-secondary:hover { background: var(--gray-200); }
.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--gray-500);
}
</style>
