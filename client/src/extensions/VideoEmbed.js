import { Node, mergeAttributes } from '@tiptap/core'

export default Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: '100%' },
      height: { default: '315' }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-video-embed]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src || ''
    return ['div', mergeAttributes({ 'data-video-embed': '', class: 'video-embed-wrapper' }), [
      'iframe', {
        src,
        width: HTMLAttributes.width,
        height: HTMLAttributes.height,
        frameborder: '0',
        allowfullscreen: 'true',
        style: 'max-width:100%;border-radius:8px;'
      }
    ]]
  },

  addCommands() {
    return {
      setVideoEmbed: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options
        })
      }
    }
  }
})
