<template>
  <div v-if="visible" class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog">
      <h2>Insert Image</h2>
      <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
        <input type="file" ref="fileInput" accept="image/*" @change="handleFile" style="display:none" />
        <p>Drag & drop an image here, or</p>
        <button class="btn btn-primary" @click="$refs.fileInput.click()">Choose File</button>
        <p v-if="uploading" class="upload-status">Uploading...</p>
        <p v-if="error" class="upload-error">{{ error }}</p>
      </div>
      <div class="or-divider">or paste URL</div>
      <div class="url-input">
        <input v-model="imageUrl" type="text" placeholder="https://example.com/image.jpg" />
        <button class="btn btn-primary" @click="insertFromUrl" :disabled="!imageUrl.trim()">Insert</button>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import client from '../../api/client.js'

const props = defineProps({
  visible: Boolean,
  documentId: String,
  editor: Object
})

const emit = defineEmits(['close'])

const imageUrl = ref('')
const uploading = ref(false)
const error = ref('')
const fileInput = ref(null)

function handleDrop(e) {
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) uploadFile(file)
}

function handleFile(e) {
  const file = e.target.files[0]
  if (file) uploadFile(file)
}

async function uploadFile(file) {
  uploading.value = true
  error.value = ''
  try {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await client.post(`/documents/${props.documentId}/uploads`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    props.editor.chain().focus().setImage({ src: data.url }).run()
    emit('close')
  } catch (err) {
    error.value = err.response?.data?.message || 'Upload failed'
  } finally {
    uploading.value = false
  }
}

function insertFromUrl() {
  if (!imageUrl.value.trim()) return
  props.editor.chain().focus().setImage({ src: imageUrl.value.trim() }).run()
  imageUrl.value = ''
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
  width: 420px;
  max-width: 90vw;
}
.dialog h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
}
.upload-area {
  border: 2px dashed var(--gray-300);
  border-radius: var(--radius);
  padding: 1.5rem;
  text-align: center;
}
.upload-area p { font-size: 0.85rem; color: var(--gray-500); margin-bottom: 0.5rem; }
.upload-status { color: var(--primary); }
.upload-error { color: #dc2626; }
.or-divider {
  text-align: center;
  font-size: 0.8rem;
  color: var(--gray-400);
  margin: 1rem 0;
}
.url-input {
  display: flex;
  gap: 0.5rem;
}
.url-input input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius);
  font-size: 0.875rem;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
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
