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

  const existingTemplate = db.prepare('SELECT id FROM templates WHERE is_system = 1').get();
  if (!existingTemplate) {
    // Meeting Minutes template
    db.prepare('INSERT INTO templates (id, title, description, category, content_json, content_text, is_system) VALUES (?, ?, ?, ?, ?, ?, 1)').run(
      uuidv4(), 'Meeting Minutes', 'Standard meeting minutes template with agenda and action items', 'meeting',
      JSON.stringify({type:"doc",content:[{type:"heading",attrs:{level:1},content:[{type:"text",text:"Meeting Minutes"}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Date"}]},{type:"paragraph",content:[{type:"text",text:"YYYY-MM-DD"}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Attendees"}]},{type:"bulletList",content:[{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"Name 1"}]}]},{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"Name 2"}]}]}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Agenda"}]},{type:"orderedList",content:[{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"Item 1"}]}]},{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"Item 2"}]}]}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Discussion Notes"}]},{type:"paragraph",content:[{type:"text",text:"..."}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Action Items"}]},{type:"bulletList",content:[{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"[ ] Action item - Owner - Due date"}]}]}]}]}),
      'Meeting Minutes\nDate\nYYYY-MM-DD\nAttendees\nName 1\nName 2\nAgenda\n1. Item 1\n2. Item 2\nDiscussion Notes\n...\nAction Items\n[ ] Action item - Owner - Due date'
    );

    // Project Proposal template
    db.prepare('INSERT INTO templates (id, title, description, category, content_json, content_text, is_system) VALUES (?, ?, ?, ?, ?, ?, 1)').run(
      uuidv4(), 'Project Proposal', 'Professional project proposal with objectives and timeline', 'proposal',
      JSON.stringify({type:"doc",content:[{type:"heading",attrs:{level:1},content:[{type:"text",text:"Project Proposal"}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Executive Summary"}]},{type:"paragraph",content:[{type:"text",text:"Brief overview of the project..."}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Objectives"}]},{type:"bulletList",content:[{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"Objective 1"}]}]},{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"Objective 2"}]}]}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Timeline"}]},{type:"paragraph",content:[{type:"text",text:"Phase 1: ..."}]},{type:"paragraph",content:[{type:"text",text:"Phase 2: ..."}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Budget"}]},{type:"paragraph",content:[{type:"text",text:"Estimated budget: ..."}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Expected Outcomes"}]},{type:"paragraph",content:[{type:"text",text:"..."}]}]}),
      'Project Proposal\nExecutive Summary\nBrief overview of the project...\nObjectives\nObjective 1\nObjective 2\nTimeline\nPhase 1: ...\nPhase 2: ...\nBudget\nEstimated budget: ...\nExpected Outcomes\n...'
    );

    // Weekly Report template
    db.prepare('INSERT INTO templates (id, title, description, category, content_json, content_text, is_system) VALUES (?, ?, ?, ?, ?, ?, 1)').run(
      uuidv4(), 'Weekly Report', 'Weekly status report with accomplishments and blockers', 'report',
      JSON.stringify({type:"doc",content:[{type:"heading",attrs:{level:1},content:[{type:"text",text:"Weekly Report"}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Week of"}]},{type:"paragraph",content:[{type:"text",text:"YYYY-MM-DD to YYYY-MM-DD"}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Accomplishments"}]},{type:"bulletList",content:[{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"Completed item 1"}]}]},{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"Completed item 2"}]}]}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"In Progress"}]},{type:"bulletList",content:[{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"Working on..."}]}]}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Blockers"}]},{type:"bulletList",content:[{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"Blocker description..."}]}]}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Next Week Plan"}]},{type:"bulletList",content:[{type:"listItem",content:[{type:"paragraph",content:[{type:"text",text:"Plan item..."}]}]}]}]}),
      'Weekly Report\nWeek of\nYYYY-MM-DD to YYYY-MM-DD\nAccomplishments\nCompleted item 1\nCompleted item 2\nIn Progress\nWorking on...\nBlockers\nBlocker description...\nNext Week Plan\nPlan item...'
    );

    console.log('System templates seeded.');
  }
}

seed().catch(console.error);
