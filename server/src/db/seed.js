const db = require('./connection');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const migrate = require('./migrate');

async function seed() {
  await migrate();

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('alice@test.com');
  if (existingUser) {
    console.log('Seed data already exists, skipping.');
    return;
  }

  const hash = await bcrypt.hash('password123', config.bcryptRounds);

  const aliceId = uuidv4();
  const bobId = uuidv4();

  db.prepare('INSERT INTO users (id, email, username, password_hash, display_name) VALUES (?, ?, ?, ?, ?)').run(aliceId, 'alice@test.com', 'alice', hash, 'Alice Wang');
  db.prepare('INSERT INTO users (id, email, username, password_hash, display_name) VALUES (?, ?, ?, ?, ?)').run(bobId, 'bob@test.com', 'bob', hash, 'Bob Li');

  const docId = uuidv4();
  db.prepare('INSERT INTO documents (id, title, owner_id, content_text) VALUES (?, ?, ?, ?)').run(docId, 'Welcome Document', aliceId, 'This is a sample document for testing.');

  console.log('Seed data created successfully.');
  console.log('Test accounts: alice@test.com / bob@test.com (password: password123)');
}

seed().catch(console.error);
