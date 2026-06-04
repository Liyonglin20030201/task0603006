const jwt = require('jsonwebtoken');
const config = require('../config');

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.accessTokenExpiry });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.refreshTokenExpiry });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwtRefreshSecret);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
