<template>
  <div class="templates-page">
    <header class="page-header">
      <h1>Document Templates</h1>
    </header>

    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.value"
        class="tab-btn"
        :class="{ active: selectedCategory === cat.value }"
        @click="selectedCategory = cat.value"
      >
        {{ cat.label }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">Loading templates...</div>

    <div v-else-if="filteredTemplates.length === 0" class="empty-state">
      <p>No templates in this category.</p>
    </div>

    <div v-else class="templates-grid">
      <div v-for="template in filteredTemplates" :key="template.id" class="template-card">
        <div class="template-card-header">
          <h3>{{ template.title }}</h3>
          <span class="category-badge">{{ template.category }}</span>
        </div>
        <p class="template-desc">{{ template.description }}</p>
        <div class="template-preview">{{ template.content_text?.substring(0, 120) }}...</div>
        <div class="template-actions">
          <button class="btn btn-primary" @click="useTemplate(template)">Use Template</button>
          <button v-if="!template.is_system && template.created_by === authStore.user?.id" class="btn btn-danger" @click="deleteTemplate(template.id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplatesStore } from '../stores/templates.js'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const templatesStore = useTemplatesStore()
const authStore = useAuthStore()

const selectedCategory = ref('all')
const loading = computed(() => templatesStore.loading)

const categories = [
  { value: 'all', label: 'All' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'report', label: 'Report' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'general', label: 'General' },
  { value: 'notes', label: 'Notes' }
]

const filteredTemplates = computed(() => {
  if (selectedCategory.value === 'all') return templatesStore.templates
  return templatesStore.templates.filter(t => t.category === selectedCategory.value)
})

onMounted(() => {
  templatesStore.fetchTemplates()
})

async function useTemplate(template) {
  const doc = await templatesStore.createDocFromTemplate(template.id, template.title)
  router.push(`/documents/${doc.id}`)
}

async function deleteTemplate(id) {
  if (confirm('Are you sure you want to delete this template?')) {
    await templatesStore.deleteTemplate(id)
  }
}
</script>

<style scoped>
.templates-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 1.5rem;
}
.page-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-800);
}
.category-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.tab-btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-600);
  background: var(--gray-100);
  border: none;
  cursor: pointer;
}
.tab-btn:hover {
  background: var(--gray-200);
}
.tab-btn.active {
  background: var(--primary);
  color: white;
}
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}
.template-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.template-card:hover {
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.template-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.template-card-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
}
.category-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 9999px;
  font-weight: 500;
  text-transform: capitalize;
}
.template-desc {
  font-size: 0.85rem;
  color: var(--gray-600);
}
.template-preview {
  font-size: 0.8rem;
  color: var(--gray-500);
  background: var(--gray-50);
  padding: 0.75rem;
  border-radius: var(--radius);
  white-space: pre-wrap;
  max-height: 80px;
  overflow: hidden;
}
.template-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.5rem;
}
.btn {
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
}
.btn-primary {
  background: var(--primary);
  color: white;
}
.btn-primary:hover { background: var(--primary-hover); }
.btn-danger {
  background: #fee2e2;
  color: #dc2626;
}
.btn-danger:hover { background: #fecaca; }
.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--gray-500);
}
</style>
