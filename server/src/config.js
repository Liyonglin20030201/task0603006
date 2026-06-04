const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  wsPort: parseInt(process.env.WS_PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  dbPath: process.env.DB_PATH
    ? path.resolve(__dirname, '../../', process.env.DB_PATH)
    : path.resolve(__dirname, '../data/collab.db'),
  bcryptRounds: 12,
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d'
};
