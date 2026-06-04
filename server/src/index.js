const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const { setupWSServer } = require('./ws');
const documentService = require('./services/documentService');
const migrate = require('./db/migrate');

async function startServer() {
  await migrate();

  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/documents', require('./routes/documents'));
  app.use('/api/documents', require('./routes/versions'));
  app.use('/api/documents', require('./routes/shares'));
  app.use('/api/documents', require('./routes/comments'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/search', require('./routes/search'));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(errorHandler);

  const server = http.createServer(app);
  setupWSServer(server);

  server.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`WebSocket available at ws://localhost:${config.port}/ws/:documentId`);
  });

  // Trash cleanup: run every hour
  setInterval(() => {
    documentService.cleanupTrash();
  }, 60 * 60 * 1000);

  return { app, server };
}

startServer().catch(console.error);
