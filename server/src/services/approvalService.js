const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const documentService = require('./documentService');
const notificationService = require('./notificationService');

function submitForApproval(documentId, requesterId, { title, message, reviewerIds }) {
  // Verify requester owns the document
  const { doc } = documentService.checkAccess(documentId, requesterId, 'edit');
  if (doc.owner_id !== requesterId) throw new ForbiddenError('Only the owner can submit for approval');

  // Check no pending approval exists
  const existing = db.prepare("SELECT id FROM approval_requests WHERE document_id = ? AND status = 'pending'").get(documentId);
  if (existing) throw new ForbiddenError('Document already has a pending approval request');

  const requestId = uuidv4();
  db.prepare(`INSERT INTO approval_requests (id, document_id, requester_id, status, title, message) VALUES (?, ?, ?, 'pending', ?, ?)`).run(requestId, documentId, requesterId, title || doc.title, message || '');

  // Create reviewer entries
  for (const reviewerId of reviewerIds) {
    const reviewer = db.prepare('SELECT id FROM users WHERE id = ?').get(reviewerId);
    if (!reviewer) continue;
    db.prepare('INSERT INTO approval_reviewers (id, request_id, reviewer_id, decision, comment) VALUES (?, ?, ?, \'pending\', \'\')').run(uuidv4(), requestId, reviewerId);

    // Send notification
    const requester = db.prepare('SELECT display_name FROM users WHERE id = ?').get(requesterId);
    notificationService.create(reviewerId, {
      type: 'approval_requested',
      title: 'Approval Request',
      message: `${requester.display_name} requested your approval for "${title || doc.title}"`,
      metadata: { documentId, requestId }
    });
  }

  // Update document approval_status
  db.prepare("UPDATE documents SET approval_status = 'pending', updated_at = datetime('now') WHERE id = ?").run(documentId);

  return db.prepare('SELECT * FROM approval_requests WHERE id = ?').get(requestId);
}

function listByDocument(documentId, userId) {
  documentService.checkAccess(documentId, userId, 'view');
  const requests = db.prepare(`
    SELECT ar.*, u.display_name as requester_name
    FROM approval_requests ar
    JOIN users u ON u.id = ar.requester_id
    WHERE ar.document_id = ?
    ORDER BY ar.created_at DESC
  `).all(documentId);

  for (const req of requests) {
    req.reviewers = db.prepare(`
      SELECT arv.*, u.display_name as reviewer_name
      FROM approval_reviewers arv
      JOIN users u ON u.id = arv.reviewer_id
      WHERE arv.request_id = ?
    `).all(req.id);
  }
  return requests;
}

function listPendingForUser(userId) {
  return db.prepare(`
    SELECT ar.*, d.title as document_title, u.display_name as requester_name,
           arv.decision as my_decision
    FROM approval_reviewers arv
    JOIN approval_requests ar ON ar.id = arv.request_id
    JOIN documents d ON d.id = ar.document_id
    JOIN users u ON u.id = ar.requester_id
    WHERE arv.reviewer_id = ? AND ar.status = 'pending'
    ORDER BY ar.created_at DESC
  `).all(userId);
}

function getRequest(requestId, userId) {
  const request = db.prepare(`
    SELECT ar.*, u.display_name as requester_name, d.title as document_title
    FROM approval_requests ar
    JOIN users u ON u.id = ar.requester_id
    JOIN documents d ON d.id = ar.document_id
    WHERE ar.id = ?
  `).get(requestId);
  if (!request) throw new NotFoundError('Approval request not found');

  request.reviewers = db.prepare(`
    SELECT arv.*, u.display_name as reviewer_name
    FROM approval_reviewers arv
    JOIN users u ON u.id = arv.reviewer_id
    WHERE arv.request_id = ?
  `).all(requestId);

  return request;
}

function approve(requestId, reviewerId, comment) {
  const reviewer = db.prepare("SELECT * FROM approval_reviewers WHERE request_id = ? AND reviewer_id = ?").get(requestId, reviewerId);
  if (!reviewer) throw new ForbiddenError('You are not a reviewer for this request');
  if (reviewer.decision !== 'pending') throw new ForbiddenError('You have already made a decision');

  db.prepare("UPDATE approval_reviewers SET decision = 'approved', comment = ?, decided_at = datetime('now') WHERE request_id = ? AND reviewer_id = ?").run(comment || '', requestId, reviewerId);

  // Check if all reviewers approved
  const pending = db.prepare("SELECT COUNT(*) as count FROM approval_reviewers WHERE request_id = ? AND decision = 'pending'").get(requestId);
  if (pending.count === 0) {
    const rejected = db.prepare("SELECT COUNT(*) as count FROM approval_reviewers WHERE request_id = ? AND decision = 'rejected'").get(requestId);
    if (rejected.count === 0) {
      db.prepare("UPDATE approval_requests SET status = 'approved', resolved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(requestId);
      const request = db.prepare('SELECT * FROM approval_requests WHERE id = ?').get(requestId);
      db.prepare("UPDATE documents SET approval_status = 'approved', updated_at = datetime('now') WHERE id = ?").run(request.document_id);

      const reviewerUser = db.prepare('SELECT display_name FROM users WHERE id = ?').get(reviewerId);
      notificationService.create(request.requester_id, {
        type: 'approval_approved',
        title: 'Document Approved',
        message: `Your document has been approved`,
        metadata: { documentId: request.document_id, requestId }
      });
    }
  }

  return { message: 'Approved successfully' };
}

function reject(requestId, reviewerId, comment) {
  const reviewer = db.prepare("SELECT * FROM approval_reviewers WHERE request_id = ? AND reviewer_id = ?").get(requestId, reviewerId);
  if (!reviewer) throw new ForbiddenError('You are not a reviewer for this request');
  if (reviewer.decision !== 'pending') throw new ForbiddenError('You have already made a decision');

  db.prepare("UPDATE approval_reviewers SET decision = 'rejected', comment = ?, decided_at = datetime('now') WHERE request_id = ? AND reviewer_id = ?").run(comment || '', requestId, reviewerId);

  // Any rejection rejects the whole request
  db.prepare("UPDATE approval_requests SET status = 'rejected', resolved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(requestId);
  const request = db.prepare('SELECT * FROM approval_requests WHERE id = ?').get(requestId);
  db.prepare("UPDATE documents SET approval_status = 'rejected', updated_at = datetime('now') WHERE id = ?").run(request.document_id);

  const reviewerUser = db.prepare('SELECT display_name FROM users WHERE id = ?').get(reviewerId);
  notificationService.create(request.requester_id, {
    type: 'approval_rejected',
    title: 'Document Rejected',
    message: `${reviewerUser.display_name} rejected your document`,
    metadata: { documentId: request.document_id, requestId }
  });

  return { message: 'Rejected' };
}

function cancel(requestId, requesterId) {
  const request = db.prepare('SELECT * FROM approval_requests WHERE id = ?').get(requestId);
  if (!request) throw new NotFoundError('Request not found');
  if (request.requester_id !== requesterId) throw new ForbiddenError('Only the requester can cancel');
  if (request.status !== 'pending') throw new ForbiddenError('Only pending requests can be cancelled');

  db.prepare("UPDATE approval_requests SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(requestId);
  db.prepare("UPDATE documents SET approval_status = NULL, updated_at = datetime('now') WHERE id = ?").run(request.document_id);

  return { message: 'Cancelled' };
}

module.exports = { submitForApproval, listByDocument, listPendingForUser, getRequest, approve, reject, cancel };
