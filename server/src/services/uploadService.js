const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const db = require('../db/connection');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const documentService = require('./documentService');
const { UPLOAD_DIR } = require('../middleware/upload');

function upload(userId, documentId, file) {
  if (documentId) {
    documentService.checkAccess(documentId, userId, 'edit');
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO uploads (id, filename, original_name, mime_type, size, document_id, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, file.filename, file.originalname, file.mimetype, file.size, documentId || null, userId);

  return {
    id,
    filename: file.filename,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size: file.size,
    url: `/api/uploads/${file.filename}`
  };
}

function getFile(filename) {
  const safeName = path.basename(filename);
  const filePath = path.resolve(UPLOAD_DIR, safeName);
  if (!filePath.startsWith(UPLOAD_DIR)) throw new ForbiddenError('Invalid path');
  if (!fs.existsSync(filePath)) throw new NotFoundError('File not found');

  const record = db.prepare('SELECT * FROM uploads WHERE filename = ?').get(safeName);
  return { filePath, record };
}

function deleteFile(fileId, userId) {
  const record = db.prepare('SELECT * FROM uploads WHERE id = ?').get(fileId);
  if (!record) throw new NotFoundError('File not found');
  if (record.uploaded_by !== userId) throw new ForbiddenError('Only the uploader can delete this file');

  const filePath = path.resolve(UPLOAD_DIR, record.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare('DELETE FROM uploads WHERE id = ?').run(fileId);
}

function listByDocument(documentId, userId) {
  documentService.checkAccess(documentId, userId, 'view');
  return db.prepare(`
    SELECT id, filename, original_name, mime_type, size, uploaded_by, created_at
    FROM uploads WHERE document_id = ?
    ORDER BY created_at DESC
  `).all(documentId);
}

module.exports = { upload, getFile, deleteFile, listByDocument };
