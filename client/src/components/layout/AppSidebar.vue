<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <button class="nav-btn create-btn" @click="createDoc">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        New Document
      </button>
      <router-link to="/" class="nav-link" active-class="active">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/></svg>
        My Documents
      </router-link>
      <router-link to="/search" class="nav-link" active-class="active">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        Search
      </router-link>
      <router-link to="/templates" class="nav-link" active-class="active">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        Templates
      </router-link>
      <router-link to="/approvals" class="nav-link" active-class="active">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        Approvals
      </router-link>
      <router-link to="/archive" class="nav-link" active-class="active">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
        Archive
      </router-link>
      <router-link to="/trash" class="nav-link" active-class="active">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        Trash
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useDocumentsStore } from '../../stores/documents.js'

const router = useRouter()
const docStore = useDocumentsStore()

async function createDoc() {
  const doc = await docStore.createDocument()
  router.push(`/documents/${doc.id}`)
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid var(--gray-200);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.create-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  margin-bottom: 0.75rem;
  background: var(--primary);
  color: white;
  border-radius: var(--radius);
  font-weight: 500;
}
.create-btn:hover { background: var(--primary-hover); }
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  color: var(--gray-600);
  text-decoration: none;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
}
.nav-link:hover { background: var(--gray-100); color: var(--gray-800); }
.nav-link.active { background: var(--primary-light); color: var(--primary); }
</style>
