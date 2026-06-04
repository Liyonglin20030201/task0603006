const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');
const config = require('../config');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { UnauthorizedError, ValidationError } = require('../utils/errors');

function generateTokens(user) {
  const payload = { sub: user.id, email: user.email, username: user.username };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({ sub: user.id, type: 'refresh' })
  };
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

async function register({ email, username, password, displayName }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existing) {
    throw new ValidationError('Email or username already exists');
  }

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  db.prepare(`
    INSERT INTO users (id, email, username, password_hash, display_name) VALUES (?, ?, ?, ?, ?)
  `).run(id, email, username, passwordHash, displayName);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const tokens = generateTokens(user);
  return { user: sanitizeUser(user), ...tokens };
}

async function login({ email, password }) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokens = generateTokens(user);
  return { user: sanitizeUser(user), ...tokens };
}

function refresh(refreshToken) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
    if (!user) throw new UnauthorizedError('User not found');
    const tokens = generateTokens(user);
    return { user: sanitizeUser(user), ...tokens };
  } catch (err) {
    throw new UnauthorizedError('Invalid refresh token');
  }
}

function getProfile(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw new UnauthorizedError('User not found');
  return sanitizeUser(user);
}

function updateProfile(userId, { displayName, avatarUrl }) {
  db.prepare(`
    UPDATE users SET display_name = COALESCE(?, display_name), avatar_url = COALESCE(?, avatar_url), updated_at = datetime('now') WHERE id = ?
  `).run(displayName || null, avatarUrl || null, userId);
  return getProfile(userId);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new ValidationError('Current password is incorrect');

  const hash = await bcrypt.hash(newPassword, config.bcryptRounds);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hash, userId);
}

module.exports = { register, login, refresh, getProfile, updateProfile, changePassword };
