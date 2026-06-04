import { ref } from 'vue'

export function useExport(editorRef, docTitle) {
  const exporting = ref(false)

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function getTitle() {
    return (typeof docTitle === 'function' ? docTitle() : docTitle?.value) || 'document'
  }

  function exportHtml() {
    const editor = editorRef.value?.editor
    if (!editor) return
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${getTitle()}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.75; color: #1f2937; }
h1 { font-size: 2rem; } h2 { font-size: 1.5rem; } h3 { font-size: 1.25rem; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
td, th { border: 1px solid #d1d5db; padding: 0.5rem; }
th { background: #f3f4f6; }
blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; color: #6b7280; }
code { background: #f3f4f6; padding: 0.15rem 0.3rem; border-radius: 3px; }
pre { background: #1f2937; color: #f8f8f2; padding: 1rem; border-radius: 0.5rem; }
img { max-width: 100%; }
</style>
</head>
<body>
${editor.getHTML()}
</body>
</html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    downloadBlob(blob, `${getTitle()}.html`)
  }

  function exportText() {
    const editor = editorRef.value?.editor
    if (!editor) return
    const text = editor.getText()
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    downloadBlob(blob, `${getTitle()}.txt`)
  }

  async function exportMarkdown() {
    const editor = editorRef.value?.editor
    if (!editor) return
    const { default: TurndownService } = await import('turndown')
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    })
    const html = editor.getHTML()
    const md = `# ${getTitle()}\n\n${turndown.turndown(html)}`
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, `${getTitle()}.md`)
  }

  async function exportPdf() {
    const editor = editorRef.value?.editor
    if (!editor) return
    exporting.value = true
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = document.querySelector('.editor-content .ProseMirror')
      if (!element) return
      await html2pdf().set({
        margin: [15, 15, 15, 15],
        filename: `${getTitle()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).save()
    } finally {
      exporting.value = false
    }
  }

  return { exporting, exportHtml, exportText, exportMarkdown, exportPdf }
}
