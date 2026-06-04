const documentService = require('./documentService');

function exportAsHtml(documentId, userId) {
  const doc = documentService.getById(documentId, userId);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(doc.title)}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.75; color: #1f2937; }
h1 { font-size: 2rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
h2 { font-size: 1.5rem; margin-top: 2rem; }
h3 { font-size: 1.25rem; margin-top: 1.5rem; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
td, th { border: 1px solid #d1d5db; padding: 0.5rem; }
th { background: #f3f4f6; font-weight: 600; }
blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; color: #6b7280; margin: 1rem 0; }
code { background: #f3f4f6; padding: 0.15rem 0.3rem; border-radius: 3px; font-size: 0.9em; }
pre { background: #1f2937; color: #f8f8f2; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
img { max-width: 100%; height: auto; }
ul, ol { padding-left: 1.5rem; }
</style>
</head>
<body>
<h1>${escapeHtml(doc.title)}</h1>
<div>${doc.content_text || ''}</div>
</body>
</html>`;
  return { html, title: doc.title };
}

function exportAsText(documentId, userId) {
  const doc = documentService.getById(documentId, userId);
  return { text: doc.content_text || '', title: doc.title };
}

function exportAsMarkdown(documentId, userId) {
  const doc = documentService.getById(documentId, userId);
  const text = doc.content_text || '';
  const md = `# ${doc.title}\n\n${text}`;
  return { markdown: md, title: doc.title };
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = { exportAsHtml, exportAsText, exportAsMarkdown };
