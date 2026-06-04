<template>
  <div class="export-menu" v-if="visible">
    <div class="export-menu-backdrop" @click="$emit('close')"></div>
    <div class="export-menu-dropdown">
      <button @click="handleExport('html')">Export as HTML</button>
      <button @click="handleExport('text')">Export as Plain Text</button>
      <button @click="handleExport('markdown')">Export as Markdown</button>
      <button @click="handleExport('pdf')">
        {{ exporting ? 'Generating PDF...' : 'Export as PDF' }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: Boolean,
  exporting: Boolean
})

const emit = defineEmits(['close', 'export'])

function handleExport(format) {
  emit('export', format)
  emit('close')
}
</script>

<style scoped>
.export-menu {
  position: relative;
}
.export-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
}
.export-menu-dropdown {
  position: absolute;
  top: 0;
  right: 0;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  min-width: 180px;
  z-index: 100;
  overflow: hidden;
}
.export-menu-dropdown button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--gray-700);
}
.export-menu-dropdown button:hover {
  background: var(--gray-100);
}
</style>
