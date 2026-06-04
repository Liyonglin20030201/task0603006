const http = require('http');
const WebSocket = require('ws');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const { verifyAccessToken } = require('../utils/jwt');
const db = require('../db/connection');
const SQLitePersistence = require('./persistence');

const messageSync = 0;
const messageAwareness = 1;

const persistence = new SQLitePersistence();
const docs = new Map();
const conns = new Map();

function getYDoc(docName) {
  if (docs.has(docName)) return docs.get(docName);

  const ydoc = new Y.Doc();
  ydoc.gc = true;
  docs.set(docName, ydoc);

  const awareness = new awarenessProtocol.Awareness(ydoc);
  awareness.setLocalState(null);
  ydoc.awareness = awareness;
  ydoc.conns = new Map();

  persistence.bindState(docName, ydoc);

  awareness.on('update', ({ added, updated, removed }, conn) => {
    const changedClients = added.concat(updated, removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients));
    const message = encoding.toUint8Array(encoder);
    broadcastToDoc(docName, message, conn);
  });

  return ydoc;
}

function broadcastToDoc(docName, message, exclude) {
  const ydoc = docs.get(docName);
  if (!ydoc) return;
  for (const [conn] of ydoc.conns) {
    if (conn !== exclude && conn.readyState === WebSocket.OPEN) {
      conn.send(message);
    }
  }
}

function closeConn(conn) {
  const docName = conns.get(conn);
  if (!docName) return;
  conns.delete(conn);

  const ydoc = docs.get(docName);
  if (!ydoc) return;

  const controlledIds = ydoc.conns.get(conn);
  ydoc.conns.delete(conn);

  if (controlledIds) {
    awarenessProtocol.removeAwarenessStates(ydoc.awareness, Array.from(controlledIds), null);
  }

  if (ydoc.conns.size === 0) {
    persistence.writeState(docName, ydoc);
    docs.delete(docName);
  }
}

function handleMessage(conn, ydoc, message, readOnly) {
  try {
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);
    const docName = conns.get(conn);

    switch (messageType) {
      case messageSync: {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);

        const syncMessageType = decoding.peekVarUint(decoder);
        // syncMessageType 0 = step1, 1 = step2, 2 = update
        if (syncMessageType === 2 && readOnly) {
          return;
        }

        syncProtocol.readSyncMessage(decoder, encoder, ydoc, conn);

        // Send response (e.g. sync step 2 reply) back to the sender
        if (encoding.length(encoder) > 1) {
          conn.send(encoding.toUint8Array(encoder));
        }

        // Broadcast the original update message to all other clients
        if (syncMessageType === 2 && docName) {
          broadcastToDoc(docName, message, conn);
        }
        break;
      }
      case messageAwareness: {
        const update = decoding.readVarUint8Array(decoder);
        awarenessProtocol.applyAwarenessUpdate(ydoc.awareness, update, conn);
        break;
      }
    }
  } catch (err) {
    console.error('WS message error:', err);
  }
}

function checkPermission(documentId, userId) {
  const doc = db.prepare('SELECT owner_id FROM documents WHERE id = ? AND status IN (?, ?)').get(documentId, 'active', 'archived');
  if (!doc) return null;
  if (doc.owner_id === userId) return 'edit';

  const share = db.prepare('SELECT permission FROM document_shares WHERE document_id = ? AND user_id = ?').get(documentId, userId);
  return share ? share.permission : null;
}

function setupWSServer(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (pathParts[0] !== 'ws' || !pathParts[1]) {
      socket.destroy();
      return;
    }

    const documentId = pathParts[1];
    const token = url.searchParams.get('token');

    if (!token) {
      socket.destroy();
      return;
    }

    let user;
    try {
      const payload = verifyAccessToken(token);
      user = { id: payload.sub, email: payload.email, username: payload.username };
    } catch {
      socket.destroy();
      return;
    }

    const permission = checkPermission(documentId, user.id);
    if (!permission) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.user = user;
      ws.permission = permission;
      ws.documentId = documentId;
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (conn) => {
    const docName = conn.documentId;
    const readOnly = conn.permission === 'view';

    conns.set(conn, docName);
    const ydoc = getYDoc(docName);
    ydoc.conns.set(conn, new Set());

    // Send sync step 1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, ydoc);
    conn.send(encoding.toUint8Array(encoder));

    // Send awareness state
    const awarenessStates = ydoc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const awarenessEncoder = encoding.createEncoder();
      encoding.writeVarUint(awarenessEncoder, messageAwareness);
      encoding.writeVarUint8Array(awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(ydoc.awareness, Array.from(awarenessStates.keys()))
      );
      conn.send(encoding.toUint8Array(awarenessEncoder));
    }

    conn.on('message', (data) => {
      const message = new Uint8Array(data);
      handleMessage(conn, ydoc, message, readOnly);
    });

    conn.on('close', () => closeConn(conn));
    conn.on('error', () => closeConn(conn));
  });

  return wss;
}

module.exports = { setupWSServer };
