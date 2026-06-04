const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');
const documentService = require('./documentService');

function listShares(documentId, userId) {
  documentService.checkAccess(documentId, userId, 'view');
  return db.prepare(`
    SELECT ds.*, u.display_name, u.email, u.username
    FROM document_shares ds
    JOIN users u ON u.id = ds.user_id
    WHERE ds.document_id = ?
  `).all(documentId);
}

function shareDocument(documentId, ownerId, { email, permission }) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc) throw new NotFoundError('Document not found');
  if (doc.owner_id !== ownerId) throw new ForbiddenError('Only the owner can share');

  const targetUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!targetUser) throw new NotFoundError('User not found with that email');
  if (targetUser.id === ownerId) throw new ValidationError('Cannot share with yourself');

  const existing = db.prepare('SELECT id FROM document_shares WHERE document_id = ? AND user_id = ?').get(documentId, targetUser.id);
  if (existing) {
    db.prepare('UPDATE document_shares SET permission = ? WHERE id = ?').run(permission, existing.id);
    return db.prepare('SELECT ds.*, u.display_name, u.email FROM document_shares ds JOIN users u ON u.id = ds.user_id WHERE ds.id = ?').get(existing.id);
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO document_shares (id, document_id, user_id, permission, shared_by) VALUES (?, ?, ?, ?, ?)
  `).run(id, documentId, targetUser.id, permission, ownerId);

  // Create notification
  const notifId = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, metadata)
    VALUES (?, ?, 'share_invite', ?, ?, ?)
  `).run(
    notifId, targetUser.id,
    'Document shared with you',
    `${doc.title} has been shared with you (${permission} access)`,
    JSON.stringify({ document_id: documentId })
  );

  return db.prepare('SELECT ds.*, u.display_name, u.email FROM document_shares ds JOIN users u ON u.id = ds.user_id WHERE ds.id = ?').get(id);
}

function updatePermission(shareId, ownerId, permission) {
  const share = db.prepare(`
    SELECT ds.*, d.owner_id FROM document_shares ds JOIN documents d ON d.id = ds.document_id WHERE ds.id = ?
  `).get(shareId);
  if (!share) throw new NotFoundError('Share not found');
  if (share.owner_id !== ownerId) throw new ForbiddenError('Only the owner can modify shares');

  db.prepare('UPDATE document_shares SET permission = ? WHERE id = ?').run(permission, shareId);
  return db.prepare('SELECT * FROM document_shares WHERE id = ?').get(shareId);
}

function revokeShare(shareId, ownerId) {
  const share = db.prepare(`
    SELECT ds.*, d.owner_id FROM document_shares ds JOIN documents d ON d.id = ds.document_id WHERE ds.id = ?
  `).get(shareId);
  if (!share) throw new NotFoundError('Share not found');
  if (share.owner_id !== ownerId) throw new ForbiddenError('Only the owner can revoke shares');

  db.prepare('DELETE FROM document_shares WHERE id = ?').run(shareId);
}

module.exports = { listShares, shareDocument, updatePermission, revokeShare };
