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
      <button @click="editor.chain().focus().setHorizontalRule().run()" title="Horizontal Rule">HR</button>
      <button @click="editor.chain().focus().undo().run()" title="Undo">↩</button>
      <button @click="editor.chain().focus().redo().run()" title="Redo">↪</button>
    </div>
  </div>
</template>

<script setup>
defineProps({ editor: Object })
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
