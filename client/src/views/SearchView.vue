<template>
  <div class="search-view">
    <div class="search-header">
      <h2>Search Documents</h2>
      <div class="search-input-wrapper">
        <input
          v-model="query"
          type="text"
          placeholder="Search by title or content..."
          @input="debounceSearch"
          autofocus
        />
      </div>
    </div>

    <div v-if="loading" class="loading">Searching...</div>
    <div v-else-if="results.length === 0 && searched" class="empty">
      No documents found for "{{ lastQuery }}"
    </div>
    <div v-else class="results">
      <div
        v-for="r in results"
        :key="r.id"
        class="result-item card"
        @click="$router.push(`/documents/${r.id}`)"
      >
        <h4>{{ r.title }}</h4>
        <p class="excerpt" v-html="r.excerpt"></p>
        <span class="meta">by {{ r.owner_name }} - {{ formatDate(r.updated_at) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { searchApi } from '../api/notifications.js'

const query = ref('')
const results = ref([])
const loading = ref(false)
const searched = ref(false)
const lastQuery = ref('')

let timer = null
function debounceSearch() {
  clearTimeout(timer)
  timer = setTimeout(doSearch, 300)
}

async function doSearch() {
  if (!query.value.trim()) {
    results.value = []
    searched.value = false
    return
  }
  loading.value = true
  searched.value = true
  lastQuery.value = query.value
  try {
    const { data } = await searchApi.search(query.value)
    results.value = data
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts + 'Z').toLocaleDateString()
}
</script>

<style scoped>
.search-header { margin-bottom: 1.5rem; }
.search-header h2 { margin-bottom: 1rem; }
.search-input-wrapper input {
  font-size: 1rem;
  padding: 0.75rem 1rem;
}
.loading, .empty {
  text-align: center;
  padding: 3rem;
  color: var(--gray-400);
}
.results { display: flex; flex-direction: column; gap: 0.75rem; }
.result-item {
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.result-item:hover { box-shadow: var(--shadow-md); }
.result-item h4 { margin-bottom: 0.3rem; }
.excerpt {
  font-size: 0.85rem;
  color: var(--gray-600);
  margin-bottom: 0.3rem;
}
.excerpt :deep(mark) {
  background: #fef08a;
  padding: 0 2px;
  border-radius: 2px;
}
.meta { font-size: 0.75rem; color: var(--gray-400); }
</style>
