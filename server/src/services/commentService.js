const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const documentService = require('./documentService');

function listComments(documentId, userId) {
  documentService.checkAccess(documentId, userId, 'view');
  return db.prepare(`
    SELECT c.*, u.display_name, u.username
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.document_id = ?
    ORDER BY c.created_at ASC
  `).all(documentId);
}

function createComment(documentId, userId, { content, anchorFrom, anchorTo, parentId }) {
  documentService.checkAccess(documentId, userId, 'comment');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO comments (id, document_id, user_id, content, anchor_from, anchor_to, parent_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, documentId, userId, content, anchorFrom || null, anchorTo || null, parentId || null);

  // Notify document owner and other participants
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  const commenter = db.prepare('SELECT display_name FROM users WHERE id = ?').get(userId);

  const recipients = new Set();
  if (doc.owner_id !== userId) recipients.add(doc.owner_id);

  const shares = db.prepare('SELECT user_id FROM document_shares WHERE document_id = ? AND user_id != ?').all(documentId, userId);
  shares.forEach(s => recipients.add(s.user_id));

  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, metadata) VALUES (?, ?, 'comment', ?, ?, ?)
  `);

  for (const recipientId of recipients) {
    insertNotif.run(
      uuidv4(), recipientId,
      'New comment',
      `${commenter.display_name} commented on "${doc.title}"`,
      JSON.stringify({ document_id: documentId, comment_id: id })
    );
  }

  return db.prepare('SELECT c.*, u.display_name, u.username FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?').get(id);
}

function updateComment(commentId, userId, content) {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
  if (!comment) throw new NotFoundError('Comment not found');
  if (comment.user_id !== userId) throw new ForbiddenError('Can only edit your own comments');

  db.prepare("UPDATE comments SET content = ?, updated_at = datetime('now') WHERE id = ?").run(content, commentId);
  return db.prepare('SELECT c.*, u.display_name, u.username FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?').get(commentId);
}

function deleteComment(commentId, userId) {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
  if (!comment) throw new NotFoundError('Comment not found');
  if (comment.user_id !== userId) throw new ForbiddenError('Can only delete your own comments');

  db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
}

function resolveComment(commentId, userId) {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
  if (!comment) throw new NotFoundError('Comment not found');
  documentService.checkAccess(comment.document_id, userId, 'comment');

  db.prepare("UPDATE comments SET resolved = 1, resolved_by = ?, resolved_at = datetime('now') WHERE id = ?").run(userId, commentId);
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
}

module.exports = { listComments, createComment, updateComment, deleteComment, resolveComment };
