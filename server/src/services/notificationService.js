const db = require('../db/connection');
const { NotFoundError } = require('../utils/errors');

function list(userId, { unread, limit = 50, offset = 0 }) {
  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [userId];

  if (unread) {
    query += ' AND read = 0';
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const notifications = db.prepare(query).all(...params);
  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').get(userId).count;

  return { notifications, unreadCount };
}

function markRead(notificationId, userId) {
  const notif = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(notificationId, userId);
  if (!notif) throw new NotFoundError('Notification not found');
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(notificationId);
}

function markAllRead(userId) {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').run(userId);
}

function dismiss(notificationId, userId) {
  const notif = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(notificationId, userId);
  if (!notif) throw new NotFoundError('Notification not found');
  db.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId);
}

module.exports = { list, markRead, markAllRead, dismiss };
