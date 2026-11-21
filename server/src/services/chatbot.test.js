const assert = require('assert');
const { getReply, normalizeText, RULES } = require('./chatbot');

const group = {
  id: 1,
  title: 'DB Midterm Prep',
  subject: 'Database Systems',
  scheduled_at: '2026-11-22T09:00:00.000Z',
  place: 'Central Library',
  members: 3,
  max_members: 6
};

const db = {
  async query(sql) {
    if (sql.includes('DISTINCT subject')) return [[{ subject: 'Database Systems' }]];
    if (sql.includes('g.subject LIKE')) return [[group]];
    if (sql.includes('FROM study_groups g')) return [[group]];
    if (sql.includes('FROM events e')) {
      return [[{ title: 'Campus Workshop', start_at: group.scheduled_at, org: 'HMIF', place: 'West Hall' }]];
    }
    if (sql.includes('FROM users u')) return [[{ total_points: 120, rank: 4 }]];
    if (sql.includes('FROM badges')) return [[{ min_answers: 5 }]];
    return [[]];
  }
};

const context = {
  user: { id: 2, name: 'Mikail' },
  community: { name: 'HMIF Announcements', organization_id: 1 },
  db,
  getLiveLocations: async () => [{ name: 'Central Library', active_people: 5 }]
};

async function run() {
  assert.strictEqual(normalizeText('  Hello, KOLABORIN! '), 'hello kolaborin');
  assert.strictEqual(RULES.length, 12);

  const messages = [
    'hello',
    'thanks',
    'bye',
    'help',
    'database',
    'study partner',
    'event',
    'where to study',
    'points',
    'badge',
    'organization',
    'collab',
    'something unrelated'
  ];

  for (const message of messages) {
    const reply = await getReply(message, context);
    assert.ok(reply, `Expected a reply for "${message}"`);
  }
}

run().then(() => {
  console.log('chatbot rules: ok');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
