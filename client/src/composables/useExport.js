import { ref } from 'vue'

export function useExport(editorRef, docTitle) {
  const exporting = ref(false)

  function getEditor() {
    const comp = editorRef.value
    if (!comp) return null
    const ed = comp.editor
    if (!ed) return null
    return ed.value || ed
  }

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
    if (typeof docTitle === 'function') return docTitle() || 'document'
    return docTitle?.value || 'document'
  }

  function exportHtml() {
    const editor = getEditor()
    if (!editor) return
    const title = getTitle()
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; line-height: 1.75; color: #1f2937; }
h1 { font-size: 2rem; margin-top: 1.5rem; } h2 { font-size: 1.5rem; margin-top: 1.25rem; } h3 { font-size: 1.25rem; margin-top: 1rem; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
td, th { border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; text-align: left; }
th { background: #f3f4f6; font-weight: 600; }
blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; color: #6b7280; margin: 1rem 0; }
code { background: #f3f4f6; padding: 0.15rem 0.35rem; border-radius: 3px; font-size: 0.9em; }
pre { background: #1f2937; color: #f8f8f2; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
img { max-width: 100%; height: auto; border-radius: 4px; }
ul, ol { padding-left: 1.5rem; }
a { color: #2563eb; }
mark { background: #fef08a; padding: 0.1rem 0.2rem; }
</style>
</head>
<body>
${editor.getHTML()}
</body>
</html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    downloadBlob(blob, `${title}.html`)
  }

  function exportText() {
    const editor = getEditor()
    if (!editor) return
    const title = getTitle()
    const text = editor.getText()
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    downloadBlob(blob, `${title}.txt`)
  }

  async function exportMarkdown() {
    const editor = getEditor()
    if (!editor) return
    const title = getTitle()
    try {
      const turndownModule = await import('turndown')
      const TurndownService = turndownModule.default || turndownModule
      const turndown = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-'
      })
      turndown.addRule('taskList', {
        filter: (node) => node.nodeName === 'LI' && node.parentNode?.getAttribute?.('data-type') === 'taskList',
        replacement: (content, node) => {
          const checkbox = node.querySelector('input[type="checkbox"]')
          const checked = checkbox?.checked ? 'x' : ' '
          return `- [${checked}] ${content.trim()}\n`
        }
      })
      turndown.addRule('table', {
        filter: 'table',
        replacement: (content, node) => {
          const rows = node.querySelectorAll('tr')
          if (rows.length === 0) return content
          let md = '\n'
          rows.forEach((row, idx) => {
            const cells = row.querySelectorAll('td, th')
            const line = Array.from(cells).map(c => c.textContent.trim()).join(' | ')
            md += `| ${line} |\n`
            if (idx === 0) {
              md += `| ${Array.from(cells).map(() => '---').join(' | ')} |\n`
            }
          })
          return md + '\n'
        }
      })
      const html = editor.getHTML()
      const md = `# ${title}\n\n${turndown.turndown(html)}`
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
      downloadBlob(blob, `${title}.md`)
    } catch (err) {
      console.error('Markdown export failed:', err)
    }
  }

  async function exportPdf() {
    const editor = getEditor()
    if (!editor) return
    exporting.value = true
    try {
      const html2pdfModule = await import('html2pdf.js')
      const html2pdf = html2pdfModule.default || html2pdfModule
      const element = document.querySelector('.editor-content .ProseMirror')
      if (!element) {
        exporting.value = false
        return
      }
      const title = getTitle()
      await html2pdf().set({
        margin: [15, 15, 15, 15],
        filename: `${title}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).save()
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      exporting.value = false
    }
  }

  return { exporting, exportHtml, exportText, exportMarkdown, exportPdf }
}
