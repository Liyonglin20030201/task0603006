const db = require('../db/connection');

function search(userId, query, { limit = 20, offset = 0 } = {}) {
  if (!query || query.trim().length === 0) return [];

  const searchTerm = `%${query.trim()}%`;

  const results = db.prepare(`
    SELECT d.id, d.title, d.updated_at, d.owner_id, d.content_text,
      u.display_name as owner_name
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    WHERE d.status = 'active'
      AND (d.title LIKE ? OR d.content_text LIKE ?)
      AND (d.owner_id = ? OR d.id IN (SELECT document_id FROM document_shares WHERE user_id = ?))
    ORDER BY d.updated_at DESC
    LIMIT ? OFFSET ?
  `).all(searchTerm, searchTerm, userId, userId, limit, offset);

  return results.map(r => {
    let excerpt = '';
    const text = r.content_text || '';
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx !== -1) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(text.length, idx + query.length + 40);
      excerpt = (start > 0 ? '...' : '') +
        text.slice(start, idx) +
        '<mark>' + text.slice(idx, idx + query.length) + '</mark>' +
        text.slice(idx + query.length, end) +
        (end < text.length ? '...' : '');
    } else {
      excerpt = text.slice(0, 80) + (text.length > 80 ? '...' : '');
    }

    const { content_text, ...rest } = r;
    return { ...rest, excerpt };
  });
}

module.exports = { search };
