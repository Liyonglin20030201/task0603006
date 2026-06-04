<template>
  <div class="toolbar">
    <div class="toolbar-group">
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ active: editor.isActive('bold') }"
        title="Bold"
      ><b>B</b></button>
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ active: editor.isActive('italic') }"
        title="Italic"
      ><i>I</i></button>
      <button
        @click="editor.chain().focus().toggleUnderline().run()"
        :class="{ active: editor.isActive('underline') }"
        title="Underline"
      ><u>U</u></button>
      <button
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ active: editor.isActive('strike') }"
        title="Strikethrough"
      ><s>S</s></button>
      <button
        @click="editor.chain().focus().toggleHighlight().run()"
        :class="{ active: editor.isActive('highlight') }"
        title="Highlight"
      >H</button>
    </div>

    <div class="toolbar-group">
      <button
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ active: editor.isActive('heading', { level: 1 }) }"
      >H1</button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ active: editor.isActive('heading', { level: 2 }) }"
      >H2</button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ active: editor.isActive('heading', { level: 3 }) }"
      >H3</button>
    </div>

    <div class="toolbar-group">
      <button
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ active: editor.isActive('bulletList') }"
        title="Bullet List"
      >UL</button>
      <button
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ active: editor.isActive('orderedList') }"
        title="Ordered List"
      >OL</button>
      <button
        @click="editor.chain().focus().toggleTaskList().run()"
        :class="{ active: editor.isActive('taskList') }"
        title="Task List"
      >TL</button>
      <button
        @click="editor.chain().focus().toggleBlockquote().run()"
        :class="{ active: editor.isActive('blockquote') }"
        title="Blockquote"
      >Q</button>
      <button
        @click="editor.chain().focus().toggleCodeBlock().run()"
        :class="{ active: editor.isActive('codeBlock') }"
        title="Code Block"
      >{ }</button>
    </div>

    <div class="toolbar-group">
      <button @click="insertTable" title="Insert Table">TBL</button>
      <button @click="$emit('insert-image')" title="Insert Image">IMG</button>
      <button @click="insertLink" title="Insert Link">LNK</button>
      <button @click="insertVideo" title="Insert Video">VID</button>
    </div>

    <div class="toolbar-group">
      <button @click="editor.chain().focus().setHorizontalRule().run()" title="Horizontal Rule">HR</button>
      <button @click="editor.chain().focus().undo().run()" title="Undo">↩</button>
      <button @click="editor.chain().focus().redo().run()" title="Redo">↪</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ editor: Object })
const emit = defineEmits(['insert-image'])

function insertTable() {
  props.editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

function insertLink() {
  const url = prompt('Enter URL:')
  if (url) {
    props.editor.chain().focus().setLink({ href: url }).run()
  }
}

function insertVideo() {
  const url = prompt('Enter video URL (YouTube/Vimeo embed URL):')
  if (url) {
    let embedUrl = url
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
    if (youtubeMatch) {
      embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }
    props.editor.commands.setVideoEmbed({ src: embedUrl })
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border-bottom: 1px solid var(--gray-200);
  flex-wrap: wrap;
}
.toolbar-group {
  display: flex;
  gap: 2px;
  padding-right: 0.5rem;
  border-right: 1px solid var(--gray-200);
}
.toolbar-group:last-child { border-right: none; }
.toolbar button {
  padding: 0.35rem 0.5rem;
  min-width: 30px;
  background: transparent;
  color: var(--gray-600);
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}
.toolbar button:hover { background: var(--gray-100); }
.toolbar button.active {
  background: var(--primary-light);
  color: var(--primary);
}
</style>
