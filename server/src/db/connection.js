const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const dir = path.dirname(config.dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(config.dbPath)) {
    const buffer = fs.readFileSync(config.dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.dbPath, buffer);
}

// Auto-save every 5 seconds
setInterval(saveDb, 5000);

// Save on process exit
process.on('exit', saveDb);
process.on('SIGINT', () => { saveDb(); process.exit(); });
process.on('SIGTERM', () => { saveDb(); process.exit(); });

// Synchronous-looking wrapper that requires initialization first
class DbWrapper {
  constructor() {
    this._ready = getDb();
  }

  async init() {
    db = await this._ready;
    return this;
  }

  prepare(sql) {
    return {
      run(...params) {
        db.run(sql, params);
        saveDb();
      },
      get(...params) {
        const stmt = db.prepare(sql);
        if (params.length) stmt.bind(params);
        if (stmt.step()) {
          const result = stmt.getAsObject();
          stmt.free();
          return result;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const results = [];
        const stmt = db.prepare(sql);
        if (params.length) stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  }

  exec(sql) {
    db.exec(sql);
    saveDb();
  }

  transaction(fn) {
    return (...args) => {
      db.run('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        db.run('COMMIT');
        saveDb();
        return result;
      } catch (e) {
        db.run('ROLLBACK');
        throw e;
      }
    };
  }
}

const wrapper = new DbWrapper();
module.exports = wrapper;
