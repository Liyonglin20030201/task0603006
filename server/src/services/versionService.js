const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { NotFoundError } = require('../utils/errors');
const documentService = require('./documentService');

function list(documentId, userId) {
  documentService.checkAccess(documentId, userId, 'view');
  return db.prepare(`
    SELECT v.*, u.display_name as created_by_name
    FROM document_versions v
    JOIN users u ON u.id = v.created_by
    WHERE v.document_id = ?
    ORDER BY v.version_number DESC
  `).all(documentId);
}

function create(documentId, userId) {
  documentService.checkAccess(documentId, userId, 'edit');
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);

  const lastVersion = db.prepare(
    'SELECT MAX(version_number) as max_v FROM document_versions WHERE document_id = ?'
  ).get(documentId);
  const versionNumber = (lastVersion.max_v || 0) + 1;

  const id = uuidv4();
  db.prepare(`
    INSERT INTO document_versions (id, document_id, version_number, title, yjs_snapshot, content_text, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, documentId, versionNumber, doc.title, doc.yjs_state || Buffer.alloc(0), doc.content_text, userId);

  return db.prepare('SELECT * FROM document_versions WHERE id = ?').get(id);
}

function getVersion(documentId, versionId, userId) {
  documentService.checkAccess(documentId, userId, 'view');
  const version = db.prepare('SELECT * FROM document_versions WHERE id = ? AND document_id = ?').get(versionId, documentId);
  if (!version) throw new NotFoundError('Version not found');
  return version;
}

function restoreVersion(documentId, versionId, userId) {
  documentService.checkAccess(documentId, userId, 'edit');
  const version = db.prepare('SELECT * FROM document_versions WHERE id = ? AND document_id = ?').get(versionId, documentId);
  if (!version) throw new NotFoundError('Version not found');

  // Save current state as a new version before restoring
  create(documentId, userId);

  // Restore the document to the target version's state
  db.prepare(`
    UPDATE documents SET yjs_state = ?, content_text = ?, updated_at = datetime('now') WHERE id = ?
  `).run(version.yjs_snapshot, version.content_text, documentId);

  // Clear incremental updates
  db.prepare('DELETE FROM yjs_updates WHERE document_id = ?').run(documentId);

  return { message: 'Version restored', version_number: version.version_number };
}

function compareVersions(documentId, versionIdA, versionIdB, userId) {
  documentService.checkAccess(documentId, userId, 'view');
  const versionA = db.prepare(`
    SELECT v.*, u.display_name as created_by_name
    FROM document_versions v JOIN users u ON u.id = v.created_by
    WHERE v.id = ? AND v.document_id = ?
  `).get(versionIdA, documentId);
  const versionB = db.prepare(`
    SELECT v.*, u.display_name as created_by_name
    FROM document_versions v JOIN users u ON u.id = v.created_by
    WHERE v.id = ? AND v.document_id = ?
  `).get(versionIdB, documentId);
  if (!versionA || !versionB) throw new NotFoundError('Version not found');
  return { versionA, versionB };
}

module.exports = { list, create, getVersion, restoreVersion, compareVersions };
