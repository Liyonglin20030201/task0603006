<template>
  <div class="editor-container" v-if="editor">
    <EditorToolbar :editor="editor" />
    <div class="editor-wrapper">
      <editor-content :editor="editor" class="editor-content" />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import EditorToolbar from './EditorToolbar.vue'

const props = defineProps({
  ydoc: Object,
  provider: Object,
  awareness: Object,
  readOnly: { type: Boolean, default: false }
})

const editor = useEditor({
  editable: !props.readOnly,
  extensions: [
    StarterKit.configure({ history: false }),
    Highlight,
    Underline,
    Placeholder.configure({ placeholder: 'Start typing...' }),
    Collaboration.configure({ document: props.ydoc }),
    CollaborationCursor.configure({
      provider: props.provider,
      user: props.awareness?.getLocalState()?.user || { name: 'Anonymous', color: '#999' }
    })
  ]
})

watch(() => props.readOnly, (val) => {
  editor.value?.setEditable(!val)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

defineExpose({ editor })
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
