const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { DOCUMENT_STATUS } = require('../../../shared/constants');

function checkAccess(documentId, userId, requiredPermission) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc) throw new NotFoundError('Document not found');

  if (doc.owner_id === userId) return { doc, permission: 'owner' };

  const share = db.prepare(
    'SELECT permission FROM document_shares WHERE document_id = ? AND user_id = ?'
  ).get(documentId, userId);

  if (!share) throw new ForbiddenError('No access to this document');

  const levels = { view: 1, comment: 2, edit: 3 };
  if (levels[share.permission] < levels[requiredPermission]) {
    throw new ForbiddenError(`Requires ${requiredPermission} permission`);
  }

  return { doc, permission: share.permission };
}

function list(userId, status = 'active') {
  return db.prepare(`
    SELECT d.*, u.display_name as owner_name,
      CASE WHEN d.owner_id = ? THEN 'owner'
           ELSE (SELECT permission FROM document_shares WHERE document_id = d.id AND user_id = ?)
      END as my_permission
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    WHERE d.status = ?
      AND (d.owner_id = ? OR d.id IN (SELECT document_id FROM document_shares WHERE user_id = ?))
    ORDER BY d.updated_at DESC
  `).all(userId, userId, status, userId, userId);
}

function getById(documentId, userId) {
  const { doc } = checkAccess(documentId, userId, 'view');
  const owner = db.prepare('SELECT display_name, username FROM users WHERE id = ?').get(doc.owner_id);
  return { ...doc, owner_name: owner.display_name, owner_username: owner.username };
}

function create(userId, title = 'Untitled') {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO documents (id, title, owner_id) VALUES (?, ?, ?)
  `).run(id, title, userId);
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
}

function updateTitle(documentId, userId, title) {
  checkAccess(documentId, userId, 'edit');
  db.prepare("UPDATE documents SET title = ?, updated_at = datetime('now') WHERE id = ?").run(title, documentId);
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
}

function trash(documentId, userId) {
  const { doc } = checkAccess(documentId, userId, 'edit');
  if (doc.owner_id !== userId) throw new ForbiddenError('Only the owner can trash a document');
  db.prepare("UPDATE documents SET status = 'trashed', trashed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(documentId);
}

function archive(documentId, userId) {
  const { doc } = checkAccess(documentId, userId, 'edit');
  if (doc.owner_id !== userId) throw new ForbiddenError('Only the owner can archive a document');
  if (doc.status !== 'active') throw new ForbiddenError('Only active documents can be archived');
  db.prepare("UPDATE documents SET status = 'archived', updated_at = datetime('now') WHERE id = ?").run(documentId);
}

function unarchive(documentId, userId) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.owner_id !== userId) throw new ForbiddenError('Only the owner can unarchive a document');
  if (doc.status !== 'archived') throw new ForbiddenError('Only archived documents can be unarchived');
  db.prepare("UPDATE documents SET status = 'active', updated_at = datetime('now') WHERE id = ?").run(documentId);
}

function restore(documentId, userId) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.owner_id !== userId) throw new ForbiddenError('Only the owner can restore a document');
  db.prepare("UPDATE documents SET status = 'active', trashed_at = NULL, updated_at = datetime('now') WHERE id = ?").run(documentId);
}

function permanentDelete(documentId, userId) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.owner_id !== userId) throw new ForbiddenError('Only the owner can permanently delete');
  db.prepare('DELETE FROM documents WHERE id = ?').run(documentId);
}

function updateContent(documentId, contentText) {
  db.prepare("UPDATE documents SET content_text = ?, updated_at = datetime('now') WHERE id = ?").run(contentText, documentId);
}

function saveContent(documentId, userId, { title, contentText }) {
  checkAccess(documentId, userId, 'edit');
  const updates = [];
  const params = [];

  if (title !== undefined && title !== null) {
    updates.push('title = ?');
    params.push(title);
  }
  if (contentText !== undefined && contentText !== null) {
    updates.push('content_text = ?');
    params.push(contentText);
  }

  if (updates.length === 0) return;

  updates.push("updated_at = datetime('now')");
  params.push(documentId);

  db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
}

function cleanupTrash() {
  db.prepare("DELETE FROM documents WHERE status = 'trashed' AND trashed_at < datetime('now', '-30 days')").run();
}

module.exports = { list, getById, create, updateTitle, trash, archive, unarchive, restore, permanentDelete, checkAccess, updateContent, saveContent, cleanupTrash };
