const { Router } = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const documentService = require('../services/documentService');

const router = Router();

router.use(auth);

router.get('/', (req, res, next) => {
  try {
    const status = req.query.status || 'active';
    const docs = documentService.list(req.user.id, status);
    res.json(docs);
  } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
  try {
    const doc = documentService.create(req.user.id, req.body.title);
    res.status(201).json(doc);
  } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
  try {
    const doc = documentService.getById(req.params.id, req.user.id);
    res.json(doc);
  } catch (err) { next(err); }
});

router.put('/:id', validate(z.object({ title: z.string().min(1).max(200) })), (req, res, next) => {
  try {
    const doc = documentService.updateTitle(req.params.id, req.user.id, req.validated.title);
    res.json(doc);
  } catch (err) { next(err); }
});

router.put('/:id/save', validate(z.object({
  title: z.string().min(1).max(200).optional(),
  contentText: z.string().optional()
})), (req, res, next) => {
  try {
    const doc = documentService.saveContent(req.params.id, req.user.id, req.validated);
    res.json(doc);
  } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
  try {
    documentService.trash(req.params.id, req.user.id);
    res.json({ message: 'Document moved to trash' });
  } catch (err) { next(err); }
});

router.post('/:id/archive', (req, res, next) => {
  try {
    documentService.archive(req.params.id, req.user.id);
    res.json({ message: 'Document archived' });
  } catch (err) { next(err); }
});

router.post('/:id/unarchive', (req, res, next) => {
  try {
    documentService.unarchive(req.params.id, req.user.id);
    res.json({ message: 'Document unarchived' });
  } catch (err) { next(err); }
});

router.post('/:id/restore', (req, res, next) => {
  try {
    documentService.restore(req.params.id, req.user.id);
    res.json({ message: 'Document restored' });
  } catch (err) { next(err); }
});

router.delete('/:id/permanent', (req, res, next) => {
  try {
    documentService.permanentDelete(req.params.id, req.user.id);
    res.json({ message: 'Document permanently deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
