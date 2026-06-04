const Y = require('yjs');
const db = require('../db/connection');
const documentService = require('../services/documentService');
const versionService = require('../services/versionService');

class SQLitePersistence {
  constructor() {
    this.docs = new Map();
  }

  bindState(docName, ydoc) {
    const doc = db.prepare('SELECT yjs_state FROM documents WHERE id = ?').get(docName);
    if (doc && doc.yjs_state) {
      Y.applyUpdate(ydoc, doc.yjs_state);
    }

    const updates = db.prepare(
      'SELECT update_data FROM yjs_updates WHERE document_id = ? ORDER BY id ASC'
    ).all(docName);

    for (const row of updates) {
      Y.applyUpdate(ydoc, row.update_data);
    }

    ydoc.on('update', (update) => {
      db.prepare('INSERT INTO yjs_updates (document_id, update_data) VALUES (?, ?)').run(docName, update);

      const count = db.prepare('SELECT COUNT(*) as c FROM yjs_updates WHERE document_id = ?').get(docName).c;
      if (count > 500) {
        this.compactUpdates(docName, ydoc);
      }
    });

    this.docs.set(docName, ydoc);
  }

  writeState(docName, ydoc) {
    this.compactUpdates(docName, ydoc);
    this.docs.delete(docName);
  }

  compactUpdates(docName, ydoc) {
    const state = Y.encodeStateAsUpdate(ydoc);
    const text = this.extractText(ydoc);

    const updateDoc = db.prepare(`
      UPDATE documents SET yjs_state = ?, content_text = ?, updated_at = datetime('now') WHERE id = ?
    `);
    const deleteUpdates = db.prepare('DELETE FROM yjs_updates WHERE document_id = ?');

    db.transaction(() => {
      updateDoc.run(state, text, docName);
      deleteUpdates.run(docName);
    })();

    this.maybeAutoVersion(docName, state, text);
  }

  extractText(ydoc) {
    try {
      const xmlFragment = ydoc.getXmlFragment('default');
      return xmlFragment.toDOM().textContent || '';
    } catch {
      return '';
    }
  }

  maybeAutoVersion(docName, state, text) {
    const lastVersion = db.prepare(
      "SELECT created_at FROM document_versions WHERE document_id = ? ORDER BY version_number DESC LIMIT 1"
    ).get(docName);

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

    if (!lastVersion || lastVersion.created_at < thirtyMinAgo) {
      const doc = db.prepare('SELECT owner_id FROM documents WHERE id = ?').get(docName);
      if (doc) {
        try {
          versionService.create(docName, doc.owner_id);
        } catch (e) {
          // Non-critical, log and continue
        }
      }
    }
  }
}

module.exports = SQLitePersistence;
