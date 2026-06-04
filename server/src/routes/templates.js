const { Router } = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const templateService = require('../services/templateService');
const documentService = require('../services/documentService');

const router = Router();

router.use(auth);

router.get('/', (req, res, next) => {
  try {
    const category = req.query.category || undefined;
    const templates = templateService.list(req.user.id, category);
    res.json(templates);
  } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
  try {
    const template = templateService.getById(req.params.id);
    res.json(template);
  } catch (err) { next(err); }
});

router.post('/', validate(z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(50).optional(),
  contentJson: z.string().optional(),
  contentText: z.string().optional()
})), (req, res, next) => {
  try {
    const template = templateService.create(req.user.id, req.validated);
    res.status(201).json(template);
  } catch (err) { next(err); }
});

router.post('/from-document/:docId', validate(z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(50).optional()
})), (req, res, next) => {
  try {
    const template = templateService.createFromDocument(req.user.id, req.params.docId, req.validated);
    res.status(201).json(template);
  } catch (err) { next(err); }
});

router.put('/:id', validate(z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().max(50).optional(),
  contentJson: z.string().optional(),
  contentText: z.string().optional()
})), (req, res, next) => {
  try {
    const template = templateService.update(req.params.id, req.user.id, req.validated);
    res.json(template);
  } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
  try {
    templateService.remove(req.params.id, req.user.id);
    res.json({ message: 'Template deleted' });
  } catch (err) { next(err); }
});

router.post('/create-document/:templateId', validate(z.object({
  title: z.string().min(1).max(200).optional()
})), (req, res, next) => {
  try {
    const template = templateService.getById(req.params.templateId);
    const title = req.validated.title || template.title;
    const doc = documentService.create(req.user.id, title);
    documentService.updateContent(doc.id, template.content_text);
    const updatedDoc = require('../db/connection').prepare('SELECT * FROM documents WHERE id = ?').get(doc.id);
    res.status(201).json(updatedDoc);
  } catch (err) { next(err); }
});

module.exports = router;
