<template>
  <div v-if="visible" class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog">
      <h2>Submit for Approval</h2>
      <div class="form-group">
        <label>Title</label>
        <input v-model="form.title" type="text" placeholder="Approval request title" />
      </div>
      <div class="form-group">
        <label>Message (optional)</label>
        <textarea v-model="form.message" placeholder="Additional context for reviewers..." rows="3"></textarea>
      </div>
      <div class="form-group">
        <label>Select Reviewers</label>
        <input v-model="searchQuery" type="text" placeholder="Search users by email..." @input="searchUsers" />
        <div v-if="searchResults.length" class="search-results">
          <button v-for="user in searchResults" :key="user.id" class="search-result-item" @click="addReviewer(user)">
            {{ user.display_name }} ({{ user.email }})
          </button>
        </div>
        <div v-if="selectedReviewers.length" class="selected-reviewers">
          <span v-for="r in selectedReviewers" :key="r.id" class="reviewer-tag">
            {{ r.display_name }}
            <button @click="removeReviewer(r.id)">×</button>
          </span>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn btn-primary" @click="submit" :disabled="selectedReviewers.length === 0">Submit</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import client from '../../api/client.js'
import { useApprovalsStore } from '../../stores/approvals.js'

const props = defineProps({
  visible: Boolean,
  documentId: String,
  documentTitle: String
})

const emit = defineEmits(['close', 'submitted'])

const approvalsStore = useApprovalsStore()
const form = reactive({
  title: '',
  message: ''
})
const searchQuery = ref('')
const searchResults = ref([])
const selectedReviewers = ref([])

async function searchUsers() {
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  try {
    const { data } = await client.get('/search/users', { params: { q: searchQuery.value } })
    searchResults.value = data.filter(u => !selectedReviewers.value.some(r => r.id === u.id))
  } catch {
    searchResults.value = []
  }
}

function addReviewer(user) {
  if (!selectedReviewers.value.some(r => r.id === user.id)) {
    selectedReviewers.value.push(user)
  }
  searchQuery.value = ''
  searchResults.value = []
}

function removeReviewer(id) {
  selectedReviewers.value = selectedReviewers.value.filter(r => r.id !== id)
}

async function submit() {
  if (selectedReviewers.value.length === 0) return
  await approvalsStore.submitApproval(props.documentId, {
    title: form.title || props.documentTitle,
    message: form.message,
    reviewerIds: selectedReviewers.value.map(r => r.id)
  })
  form.title = ''
  form.message = ''
  selectedReviewers.value = []
  emit('submitted')
  emit('close')
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
  z-index: 1000;
}
.dialog {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  width: 450px;
  max-width: 90vw;
}
.dialog h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: var(--gray-700);
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius);
  font-size: 0.875rem;
}
.search-results {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  max-height: 150px;
  overflow-y: auto;
  margin-top: 0.25rem;
}
.search-result-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  border: none;
  background: none;
  cursor: pointer;
}
.search-result-item:hover { background: var(--gray-100); }
.selected-reviewers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.5rem;
}
.reviewer-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}
.reviewer-tag button {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 1rem;
  cursor: pointer;
  line-height: 1;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}
.btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
}
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: var(--gray-100); color: var(--gray-700); }
.btn-secondary:hover { background: var(--gray-200); }
</style>
