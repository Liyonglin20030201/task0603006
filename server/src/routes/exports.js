const { Router } = require('express');
const auth = require('../middleware/auth');
const exportService = require('../services/exportService');

const router = Router();
router.use(auth);

router.get('/:id/export/html', (req, res, next) => {
  try {
    const { html, title } = exportService.exportAsHtml(req.params.id, req.user.id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.html"`);
    res.send(html);
  } catch (err) { next(err); }
});

router.get('/:id/export/text', (req, res, next) => {
  try {
    const { text, title } = exportService.exportAsText(req.params.id, req.user.id);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.txt"`);
    res.send(text);
  } catch (err) { next(err); }
});

router.get('/:id/export/markdown', (req, res, next) => {
  try {
    const { markdown, title } = exportService.exportAsMarkdown(req.params.id, req.user.id);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.md"`);
    res.send(markdown);
  } catch (err) { next(err); }
});

module.exports = router;
