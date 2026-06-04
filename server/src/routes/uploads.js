const { Router } = require('express');
const path = require('path');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadService = require('../services/uploadService');

const router = Router();

router.post('/documents/:id/uploads', auth, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });
    const result = uploadService.upload(req.user.id, req.params.id, req.file);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

router.get('/uploads/:filename', (req, res, next) => {
  try {
    const { filePath, record } = uploadService.getFile(req.params.filename);
    res.setHeader('Content-Type', record?.mime_type || 'application/octet-stream');
    res.sendFile(filePath);
  } catch (err) { next(err); }
});

router.delete('/uploads/:id', auth, (req, res, next) => {
  try {
    uploadService.deleteFile(req.params.id, req.user.id);
    res.json({ message: 'File deleted' });
  } catch (err) { next(err); }
});

router.get('/documents/:id/uploads', auth, (req, res, next) => {
  try {
    const files = uploadService.listByDocument(req.params.id, req.user.id);
    res.json(files);
  } catch (err) { next(err); }
});

module.exports = router;
