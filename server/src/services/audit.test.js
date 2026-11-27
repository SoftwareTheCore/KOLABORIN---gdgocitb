const assert = require('assert');
const fs = require('fs');
const path = require('path');

const serverRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(serverRoot, relativePath), 'utf8');
}

assert.ok(
  read('db/schema.sql').includes('CREATE DATABASE IF NOT EXISTS kolaborin'),
  'Schema must not drop the database'
);
assert.ok(
  read('src/services/points.js').includes('FROM users WHERE id = ? FOR UPDATE'),
  'Point awards must lock the user row'
);
assert.ok(
  read('src/routes/events.js').includes("event.status !== 'published'"),
  'Event applications must require published status'
);
assert.ok(
  read('src/routes/admin.js').includes("WHERE id = ? AND status = 'pending'"),
  'Admin organization updates must require pending status'
);
assert.ok(
  read('src/routes/admin.js').includes('UPDATE locations SET is_active = FALSE'),
  'Admin place removal must preserve referenced data'
);
assert.ok(
  !read('src/app.js').includes('/api/place-requests'),
  'Place requests must no longer be exposed by the API'
);
assert.ok(
  read('src/routes/groups.js').includes('member.creator_id !== req.user.id'),
  'Only the Open Party creator may check in participants'
);
assert.ok(
  read('src/routes/groups.js').includes("DELETE /api/groups/:id/members/:userId")
    && read('src/routes/groups.js').includes("groupRows[0].creator_id !== req.user.id"),
  'Only the Open Party creator may remove members'
);
assert.ok(
  read('src/routes/me.js').includes('avatar_data')
    && read('src/routes/me.js').includes('groups_joined_count'),
  'Profiles must support photos and show participation history'
);
assert.ok(
  read('db/migrations/004_profile_and_group_history.sql').includes('SELECT group_id, user_id, joined_at'),
  'The group history migration must retain existing memberships'
);
assert.ok(
  read('src/routes/admin.js').includes("WHERE id = ? AND status = 'pending'"),
  'Badge approvals must require pending status'
);
assert.ok(
  read('src/routes/groups.js').includes('deleteResult.affectedRows === 0'),
  'Leaving a group must verify membership deletion'
);
assert.ok(
  read('src/routes/collab.js').includes("WHERE id = ? AND status = 'pending'"),
  'Collaboration responses must require pending status'
);
assert.ok(
  read('src/middleware/errorHandler.js').includes("error: 'Internal server error'"),
  'Internal errors must not expose implementation messages'
);

console.log('audit guards: ok');
