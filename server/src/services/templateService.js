const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const documentService = require('./documentService');

function list(userId, category) {
  let sql = `
    SELECT * FROM templates
    WHERE (is_system = 1 OR created_by = ?)
  `;
  const params = [userId];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY created_at DESC';

  return db.prepare(sql).all(...params);
}

function getById(templateId) {
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
  if (!template) throw new NotFoundError('Template not found');
  return template;
}

function create(userId, { title, description, category, contentJson, contentText }) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO templates (id, title, description, category, content_json, content_text, is_system, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    id,
    title,
    description || '',
    category || 'general',
    contentJson || '{}',
    contentText || '',
    userId
  );
  return db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
}

function createFromDocument(userId, documentId, { title, description, category }) {
  const { doc } = documentService.checkAccess(documentId, userId, 'view');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO templates (id, title, description, category, content_json, content_text, is_system, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    id,
    title,
    description || '',
    category || 'general',
    '{}',
    doc.content_text || '',
    userId
  );
  return db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
}

function update(templateId, userId, updates) {
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
  if (!template) throw new NotFoundError('Template not found');
  if (template.created_by !== userId) throw new ForbiddenError('Only the owner can update this template');

  const allowedFields = ['title', 'description', 'category', 'contentJson', 'contentText'];
  const fieldMap = {
    title: 'title',
    description: 'description',
    category: 'category',
    contentJson: 'content_json',
    contentText: 'content_text'
  };

  const setClauses = [];
  const params = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${fieldMap[field]} = ?`);
      params.push(updates[field]);
    }
  }

  if (setClauses.length === 0) return template;

  setClauses.push("updated_at = datetime('now')");
  params.push(templateId);

  db.prepare(`UPDATE templates SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
  return db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
}

function remove(templateId, userId) {
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
  if (!template) throw new NotFoundError('Template not found');
  if (template.is_system === 1) throw new ForbiddenError('Cannot delete system templates');
  if (template.created_by !== userId) throw new ForbiddenError('Only the owner can delete this template');

  db.prepare('DELETE FROM templates WHERE id = ?').run(templateId);
}

module.exports = { list, getById, create, createFromDocument, update, remove };
