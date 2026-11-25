const crypto = require('crypto');

async function seedLiveSpotDemo(pool) {
  const [organizations] = await pool.query(
    `SELECT id, owner_id FROM organizations
     WHERE name = ? AND status = 'verified'
     LIMIT 1`,
    ['Himpunan Mahasiswa Informatika (HMIF)']
  );
  if (organizations.length === 0) {
    throw new Error('Verified HMIF demo organization was not found.');
  }

  const organization = organizations[0];
  const facilities = [
    {
      name: '[DEMO] HMIF Collaboration Room',
      type: 'meeting_room',
      address: 'Labtek V STEI Lt. 3',
      latitude: -6.8887,
      longitude: 107.6101,
      description: 'Ruang meeting organisasi dengan layar presentasi dan whiteboard.',
      shortDescription: 'Meeting room · 12 kursi · layar presentasi'
    },
    {
      name: '[DEMO] HMIF Event Studio',
      type: 'event_venue',
      address: 'Labtek VIII Lt. 1',
      latitude: -6.8881,
      longitude: 107.611,
      description: 'Venue kecil untuk workshop, diskusi, dan acara internal HMIF.',
      shortDescription: 'Event venue · kapasitas 40 orang'
    }
  ];

  const locationIds = {};
  for (const facility of facilities) {
    const [existing] = await pool.query(
      'SELECT id FROM locations WHERE organization_id = ? AND name = ? LIMIT 1',
      [organization.id, facility.name]
    );

    if (existing.length > 0) {
      locationIds[facility.type] = existing[0].id;
      await pool.query(
        `UPDATE locations
         SET type = ?, address = ?, latitude = ?, longitude = ?, description = ?,
             short_description = ?, owner_id = ?, is_active = TRUE
         WHERE id = ?`,
        [
          facility.type,
          facility.address,
          facility.latitude,
          facility.longitude,
          facility.description,
          facility.shortDescription,
          organization.owner_id,
          existing[0].id
        ]
      );
      continue;
    }

    const [result] = await pool.query(
      `INSERT INTO locations
       (name, type, address, latitude, longitude, description, short_description, owner_id, organization_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        facility.name,
        facility.type,
        facility.address,
        facility.latitude,
        facility.longitude,
        facility.description,
        facility.shortDescription,
        organization.owner_id,
        organization.id
      ]
    );
    locationIds[facility.type] = result.insertId;
  }

  const [meetingRows] = await pool.query(
    'SELECT id FROM organization_meetings WHERE organization_id = ? AND title = ? LIMIT 1',
    [organization.id, '[DEMO] Koordinasi Program Kerja HMIF']
  );
  let meetingId;
  if (meetingRows.length > 0) {
    meetingId = meetingRows[0].id;
    await pool.query(
      `UPDATE organization_meetings
       SET location_id = ?, created_by = ?, description = ?,
           start_at = DATE_ADD(NOW(), INTERVAL 1 DAY),
           end_at = DATE_ADD(NOW(), INTERVAL 26 HOUR), status = 'scheduled'
       WHERE id = ?`,
      [
        locationIds.meeting_room,
        organization.owner_id,
        'Contoh agenda rapat internal organisasi.',
        meetingRows[0].id
      ]
    );
  } else {
    const [result] = await pool.query(
      `INSERT INTO organization_meetings
       (organization_id, location_id, created_by, title, description, start_at, end_at, status)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY),
               DATE_ADD(NOW(), INTERVAL 26 HOUR), 'scheduled')`,
      [
        organization.id,
        locationIds.meeting_room,
        organization.owner_id,
        '[DEMO] Koordinasi Program Kerja HMIF',
        'Contoh agenda rapat internal organisasi.'
      ]
    );
    meetingId = result.insertId;
  }

  const [eventRows] = await pool.query(
    'SELECT id FROM events WHERE organization_id = ? AND title = ? LIMIT 1',
    [organization.id, '[DEMO] HMIF Project Showcase']
  );
  let eventId;
  if (eventRows.length > 0) {
    eventId = eventRows[0].id;
    await pool.query(
      `UPDATE events
       SET location_id = ?, description = ?,
           start_at = DATE_ADD(NOW(), INTERVAL 4 DAY),
           end_at = DATE_ADD(DATE_ADD(NOW(), INTERVAL 4 DAY), INTERVAL 2 HOUR),
           status = 'published'
       WHERE id = ?`,
      [
        locationIds.event_venue,
        'Contoh acara organisasi untuk menampilkan agenda Live Spot.',
        eventRows[0].id
      ]
    );
  } else {
    const [result] = await pool.query(
      `INSERT INTO events
       (organization_id, title, description, location_id, start_at, end_at, capacity, status)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 4 DAY),
               DATE_ADD(DATE_ADD(NOW(), INTERVAL 4 DAY), INTERVAL 2 HOUR), 40, 'published')`,
      [
        organization.id,
        '[DEMO] HMIF Project Showcase',
        'Contoh acara organisasi untuk menampilkan agenda Live Spot.',
        locationIds.event_venue
      ]
    );
    eventId = result.insertId;
  }

  const [students] = await pool.query(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    ['farrel@kolaborin.test']
  );
  if (students.length === 0) {
    throw new Error('Demo student Farrel was not found.');
  }
  const [applications] = await pool.query(
    'SELECT id, status, ticket_code FROM event_applications WHERE event_id = ? AND user_id = ? LIMIT 1',
    [eventId, students[0].id]
  );
  if (applications.length > 0) {
    await pool.query(
      `UPDATE event_applications
       SET status = 'accepted', ticket_code = COALESCE(ticket_code, ?)
       WHERE id = ?`,
      [crypto.randomBytes(32).toString('hex'), applications[0].id]
    );
  } else {
    await pool.query(
      `INSERT INTO event_applications (event_id, user_id, message, status, ticket_code)
       VALUES (?, ?, ?, 'accepted', ?)`,
      [
        eventId,
        students[0].id,
        'Pendaftaran demo untuk menguji kartu peserta dan check-in QR.',
        crypto.randomBytes(32).toString('hex')
      ]
    );
  }

  const [requestRows] = await pool.query(
    'SELECT id FROM place_requests WHERE organization_id = ? AND requester_id = ? AND name = ? LIMIT 1',
    [organization.id, organization.owner_id, '[DEMO] Ruang Meeting Tambahan']
  );
  if (requestRows.length === 0) {
    await pool.query(
      `INSERT INTO place_requests
       (requester_id, organization_id, name, type, address, latitude, longitude, short_description, status)
       VALUES (?, ?, ?, 'meeting_room', ?, ?, ?, ?, 'pending')`,
      [
        organization.owner_id,
        organization.id,
        '[DEMO] Ruang Meeting Tambahan',
        'Labtek V STEI Lt. 2',
        -6.8889,
        107.6102,
        'Permintaan contoh untuk menampilkan status review fasilitas.'
      ]
    );
  }

  return {
    organizationId: organization.id,
    locationIds,
    meetingId,
    eventId
  };
}

if (require.main === module) {
  require('dotenv').config();
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kolaborin',
    timezone: '+07:00'
  });

  seedLiveSpotDemo(pool)
    .then((result) => {
      console.log('Live Spot demo data seeded:', result);
    })
    .catch((error) => {
      console.error('Live Spot demo seeding failed:', error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = seedLiveSpotDemo;
