<template>
  <span v-if="status" class="approval-badge" :class="status">
    {{ status === 'pending' ? 'Pending Approval' : status === 'approved' ? 'Approved' : 'Rejected' }}
  </span>
</template>

<script setup>
defineProps({
  status: { type: String, default: null }
})
</script>

<style scoped>
.approval-badge {
  display: inline-block;
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 9999px;
  font-weight: 600;
  text-transform: capitalize;
}
.approval-badge.pending { background: #fef3c7; color: #d97706; }
.approval-badge.approved { background: #dcfce7; color: #16a34a; }
.approval-badge.rejected { background: #fee2e2; color: #dc2626; }
</style>
