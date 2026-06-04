<template>
  <div class="editor-container" v-if="editor">
    <EditorToolbar :editor="editor" @insert-image="showImageDialog = true" />
    <div class="editor-wrapper">
      <editor-content :editor="editor" class="editor-content" />
    </div>
    <ImageUploadDialog
      v-if="showImageDialog"
      :visible="showImageDialog"
      :documentId="documentId"
      :editor="editor"
      @close="showImageDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import VideoEmbed from '../../extensions/VideoEmbed.js'
import EditorToolbar from './EditorToolbar.vue'
import ImageUploadDialog from './ImageUploadDialog.vue'

const props = defineProps({
  ydoc: Object,
  provider: Object,
  awareness: Object,
  documentId: String,
  readOnly: { type: Boolean, default: false }
})

const emit = defineEmits(['update'])
const showImageDialog = ref(false)

const editor = useEditor({
  editable: !props.readOnly,
  extensions: [
    StarterKit.configure({ history: false }),
    Highlight,
    Underline,
    Placeholder.configure({ placeholder: 'Start typing...' }),
    Image.configure({ inline: false, allowBase64: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    TaskList,
    TaskItem.configure({ nested: true }),
    Link.configure({ openOnClick: false }),
    VideoEmbed,
    Collaboration.configure({ document: props.ydoc }),
    CollaborationCursor.configure({
      provider: props.provider,
      user: props.awareness?.getLocalState()?.user || { name: 'Anonymous', color: '#999' }
    })
  ],
  onUpdate() {
    emit('update')
  }
})

watch(() => props.readOnly, (val) => {
  editor.value?.setEditable(!val)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function getTextContent() {
  if (!editor.value) return ''
  return editor.value.getText()
}

defineExpose({ editor, getTextContent })
</script>

<style>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.editor-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}
.editor-content .ProseMirror {
  min-height: 500px;
  max-width: 800px;
  margin: 0 auto;
  outline: none;
  font-size: 1rem;
  line-height: 1.75;
}
.editor-content .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--gray-400);
  pointer-events: none;
  height: 0;
}
.editor-content .ProseMirror h1 { font-size: 2rem; margin: 1rem 0 0.5rem; }
.editor-content .ProseMirror h2 { font-size: 1.5rem; margin: 1rem 0 0.5rem; }
.editor-content .ProseMirror h3 { font-size: 1.25rem; margin: 0.75rem 0 0.5rem; }
.editor-content .ProseMirror ul, .editor-content .ProseMirror ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}
.editor-content .ProseMirror blockquote {
  border-left: 3px solid var(--gray-300);
  padding-left: 1rem;
  color: var(--gray-600);
  margin: 0.5rem 0;
}
.editor-content .ProseMirror code {
  background: var(--gray-100);
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-size: 0.9em;
}
.editor-content .ProseMirror pre {
  background: var(--gray-800);
  color: #f8f8f2;
  padding: 1rem;
  border-radius: var(--radius);
  overflow-x: auto;
}
.editor-content .ProseMirror mark {
  background: #fef08a;
}
.editor-content .ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 0.5rem 0;
  cursor: default;
}
.editor-content .ProseMirror img.ProseMirror-selectednode {
  outline: 2px solid var(--primary);
}
.editor-content .ProseMirror table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5rem 0;
}
.editor-content .ProseMirror table td,
.editor-content .ProseMirror table th {
  border: 1px solid var(--gray-300);
  padding: 0.5rem;
  min-width: 80px;
  vertical-align: top;
}
.editor-content .ProseMirror table th {
  background: var(--gray-100);
  font-weight: 600;
}
.editor-content .ProseMirror table .selectedCell {
  background: rgba(var(--primary-rgb, 59, 130, 246), 0.1);
}
.editor-content .ProseMirror ul[data-type="taskList"] {
  list-style: none;
  padding-left: 0;
}
.editor-content .ProseMirror ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
.editor-content .ProseMirror ul[data-type="taskList"] li label {
  margin-top: 0.25rem;
}
.editor-content .ProseMirror ul[data-type="taskList"] li label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.editor-content .ProseMirror .video-embed-wrapper {
  margin: 1rem 0;
  text-align: center;
}
.editor-content .ProseMirror a {
  color: var(--primary);
  text-decoration: underline;
  cursor: pointer;
}
/* Collaboration cursors */
.collaboration-cursor__caret {
  border-left: 2px solid;
  border-right: none;
  margin-left: -1px;
  pointer-events: none;
  position: relative;
  word-break: normal;
}
.collaboration-cursor__label {
  position: absolute;
  top: -1.4em;
  left: -1px;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: normal;
  padding: 0.1rem 0.3rem;
  border-radius: 3px 3px 3px 0;
  color: white;
  white-space: nowrap;
  user-select: none;
}
</style>
