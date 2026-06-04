<template>
  <div v-if="visible" class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog">
      <h2>Save as Template</h2>
      <div class="form-group">
        <label>Title</label>
        <input v-model="form.title" type="text" placeholder="Template title" />
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea v-model="form.description" placeholder="Brief description..." rows="3"></textarea>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select v-model="form.category">
          <option value="general">General</option>
          <option value="meeting">Meeting</option>
          <option value="report">Report</option>
          <option value="proposal">Proposal</option>
          <option value="notes">Notes</option>
        </select>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn btn-primary" @click="save" :disabled="!form.title.trim()">Save Template</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useTemplatesStore } from '../../stores/templates.js'

const props = defineProps({
  visible: Boolean,
  documentId: String
})

const emit = defineEmits(['close', 'saved'])

const templatesStore = useTemplatesStore()

const form = reactive({
  title: '',
  description: '',
  category: 'general'
})

async function save() {
  if (!form.title.trim()) return
  await templatesStore.createFromDocument(props.documentId, {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category
  })
  form.title = ''
  form.description = ''
  form.category = 'general'
  emit('saved')
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
  width: 400px;
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
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius);
  font-size: 0.875rem;
}
.form-group textarea {
  resize: vertical;
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
.btn-primary {
  background: var(--primary);
  color: white;
}
.btn-primary:hover { background: var(--primary-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-700);
}
.btn-secondary:hover { background: var(--gray-200); }
</style>
