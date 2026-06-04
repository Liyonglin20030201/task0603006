const { verifyAccessToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../utils/errors');

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, username: payload.username };
    next();
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

module.exports = auth;
