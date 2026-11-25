const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/orgs (Register organization - status 'pending')
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { name, description, category } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Organization name is required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO organizations (owner_id, name, description, category, status, open_for_collab)
       VALUES (?, ?, ?, ?, 'pending', FALSE)`,
      [ownerId, name.trim(), description ? description.trim() : null, category ? category.trim() : null]
    );

    res.status(201).json({
      id: result.insertId,
      name: name.trim(),
      status: 'pending',
      message: 'Organization registered. Pending admin verification.'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orgs (Browse verified organizations)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { openForCollab } = req.query;
    let query = `
      SELECT o.id, o.name, o.description, o.category, o.status, o.open_for_collab,
             u.name AS owner_name,
             (SELECT COUNT(*) FROM events e WHERE e.organization_id = o.id AND e.status = 'published') AS event_count
      FROM organizations o
      JOIN users u ON u.id = o.owner_id
      WHERE o.status = 'verified'
    `;

    const params = [];
    if (openForCollab === '1' || openForCollab === 'true') {
      query += ' AND o.open_for_collab = TRUE';
    }

    query += ' ORDER BY o.name ASC LIMIT 50';

    const [rows] = await pool.query(query, params);
    res.json(rows.map(r => ({
      ...r,
      open_for_collab: Boolean(r.open_for_collab),
      event_count: Number(r.event_count)
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/orgs/:id/analytics (Organization owner dashboard metrics)
router.get('/:id/analytics', authMiddleware, async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const requestedDays = Number(req.query.days);
    const days = [7, 14, 30].includes(requestedDays) ? requestedDays : 7;
    const [orgRows] = await pool.query(
      'SELECT id FROM organizations WHERE id = ? AND owner_id = ?',
      [orgId, req.user.id]
    );

    if (orgRows.length === 0) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const [[summary]] = await pool.query(
      `SELECT COUNT(DISTINCT CASE WHEN e.status = 'published' THEN e.id END) AS published_events,
              COUNT(ea.id) AS applications,
              COALESCE(SUM(CASE WHEN ea.status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_applications,
              COALESCE(SUM(CASE WHEN ea.status = 'accepted' THEN 1 ELSE 0 END), 0) AS accepted_applications,
              COALESCE(SUM(CASE WHEN ea.status = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected_applications
       FROM events e
       LEFT JOIN event_applications ea ON ea.event_id = e.id
       WHERE e.organization_id = ?`,
      [orgId]
    );

    const [dailyRows] = await pool.query(
      `SELECT DATE_FORMAT(ea.applied_at, '%Y-%m-%d') AS date,
              SUM(CASE WHEN ea.status = 'pending' THEN 1 ELSE 0 END) AS pending,
              SUM(CASE WHEN ea.status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
              SUM(CASE WHEN ea.status = 'rejected' THEN 1 ELSE 0 END) AS rejected
       FROM event_applications ea
       JOIN events e ON e.id = ea.event_id
       WHERE e.organization_id = ? AND ea.applied_at >= DATE_SUB(CURDATE(), INTERVAL ${days - 1} DAY)
       GROUP BY DATE(ea.applied_at)
       ORDER BY DATE(ea.applied_at) ASC`,
      [orgId]
    );
    const [[dateRow]] = await pool.query(
      "SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today"
    );

    const [recentApplications] = await pool.query(
      `SELECT ea.id, ea.status, ea.applied_at,
              e.id AS event_id, e.title AS event_title,
              u.name AS applicant_name, u.faculty, u.major
       FROM event_applications ea
       JOIN events e ON e.id = ea.event_id
       JOIN users u ON u.id = ea.user_id
       WHERE e.organization_id = ?
       ORDER BY ea.applied_at DESC
       LIMIT 6`,
      [orgId]
    );

    const [upcomingEvents] = await pool.query(
      `SELECT e.id, e.title, e.start_at, e.capacity, l.name AS location_name,
              COUNT(ea.id) AS application_count,
              COALESCE(SUM(CASE WHEN ea.status = 'accepted' THEN 1 ELSE 0 END), 0) AS accepted_count
       FROM events e
       LEFT JOIN event_applications ea ON ea.event_id = e.id
       LEFT JOIN locations l ON l.id = e.location_id
       WHERE e.organization_id = ? AND e.status = 'published' AND e.start_at >= NOW()
       GROUP BY e.id, e.title, e.start_at, e.capacity, l.name
       ORDER BY e.start_at ASC
       LIMIT 5`,
      [orgId]
    );

    const [eventRows] = await pool.query(
      `SELECT e.id, e.title, e.start_at, e.status, e.capacity,
              COUNT(ea.id) AS application_count,
              COALESCE(SUM(CASE WHEN ea.status = 'accepted' THEN 1 ELSE 0 END), 0) AS accepted_count,
              COALESCE(SUM(CASE WHEN ea.status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_count
       FROM events e
       LEFT JOIN event_applications ea ON ea.event_id = e.id
       WHERE e.organization_id = ?
       GROUP BY e.id, e.title, e.start_at, e.status, e.capacity
       ORDER BY e.start_at DESC
       LIMIT 8`,
      [orgId]
    );

    res.json({
      summary: {
        publishedEvents: Number(summary.published_events),
        applications: Number(summary.applications),
        pendingApplications: Number(summary.pending_applications),
        acceptedApplications: Number(summary.accepted_applications),
        rejectedApplications: Number(summary.rejected_applications)
      },
      daily: dailyRows.map((row) => ({
        date: row.date,
        pending: Number(row.pending),
        accepted: Number(row.accepted),
        rejected: Number(row.rejected)
      })),
      today: dateRow.today,
      recentApplications,
      upcomingEvents: upcomingEvents.map((event) => ({
        ...event,
        application_count: Number(event.application_count),
        accepted_count: Number(event.accepted_count)
      })),
      events: eventRows.map((event) => ({
        ...event,
        application_count: Number(event.application_count),
        accepted_count: Number(event.accepted_count),
        pending_count: Number(event.pending_count)
      })),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orgs/:id/live-spots (Owner event and meeting spaces)
router.get('/:id/live-spots', authMiddleware, async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const [orgRows] = await pool.query(
      'SELECT id, name, status FROM organizations WHERE id = ? AND owner_id = ?',
      [orgId, req.user.id]
    );

    if (orgRows.length === 0) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const [locations] = await pool.query(
      `SELECT id, name, type, address, description, short_description,
              CAST(latitude AS DOUBLE) AS latitude,
              CAST(longitude AS DOUBLE) AS longitude
       FROM locations
       WHERE organization_id = ? AND is_active = TRUE
         AND type IN ('meeting_room', 'event_venue')
       ORDER BY type ASC, name ASC`,
      [orgId]
    );

    const [upcomingEvents] = await pool.query(
      `SELECT e.id, e.title, e.description, e.start_at, e.end_at, e.capacity, e.location_id,
              l.name AS location_name, l.type AS location_type,
              (SELECT COUNT(*) FROM event_applications ea WHERE ea.event_id = e.id) AS application_count
       FROM events e
       LEFT JOIN locations l ON l.id = e.location_id
       WHERE e.organization_id = ? AND e.status = 'published' AND e.start_at >= NOW()
       ORDER BY e.start_at ASC
       LIMIT 50`,
      [orgId]
    );

    const [meetings] = await pool.query(
      `SELECT m.id, m.title, m.description, m.start_at, m.end_at, m.location_id,
              l.name AS location_name
       FROM organization_meetings m
       JOIN locations l ON l.id = m.location_id
       WHERE m.organization_id = ? AND m.status = 'scheduled' AND m.end_at >= NOW()
       ORDER BY m.start_at ASC
       LIMIT 50`,
      [orgId]
    );

    const [placeRequests] = await pool.query(
      `SELECT id, name, type, address, status, created_at
       FROM place_requests
       WHERE organization_id = ? AND requester_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [orgId, req.user.id]
    );

    res.json({
      organization: orgRows[0],
      locations: locations.map((location) => ({
        ...location,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude)
      })),
      upcomingEvents: upcomingEvents.map((event) => ({
        ...event,
        application_count: Number(event.application_count)
      })),
      meetings,
      placeRequests,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/orgs/:id/meetings (Owner schedules a meeting in an owned room)
router.post('/:id/meetings', authMiddleware, async (req, res, next) => {
  let conn;
  let transactionStarted = false;
  try {
    conn = await pool.getConnection();
    const orgId = req.params.id;
    const { location_id, title, description, start_at, end_at } = req.body;
    const titleText = typeof title === 'string' ? title.trim() : '';
    const startTime = typeof start_at === 'string' ? Date.parse(start_at) : NaN;
    const endTime = typeof end_at === 'string' ? Date.parse(end_at) : NaN;

    if (!location_id || !titleText || titleText.length > 150
      || !Number.isFinite(startTime) || !Number.isFinite(endTime)
      || startTime <= Date.now() || startTime >= endTime
      || (description != null && typeof description !== 'string')) {
      return res.status(400).json({ error: 'Ruangan, judul, dan rentang waktu meeting yang valid wajib diisi.' });
    }

    const sqlStart = String(start_at).replace('T', ' ');
    const sqlEnd = String(end_at).replace('T', ' ');

    await conn.beginTransaction();
    transactionStarted = true;
    const [orgRows] = await conn.query(
      'SELECT id, status FROM organizations WHERE id = ? AND owner_id = ? FOR UPDATE',
      [orgId, req.user.id]
    );
    if (orgRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Organization not found.' });
    }
    if (orgRows[0].status !== 'verified') {
      await conn.rollback();
      return res.status(403).json({ error: 'Organisasi harus terverifikasi untuk menjadwalkan meeting.' });
    }

    const [locations] = await conn.query(
      `SELECT id FROM locations
       WHERE id = ? AND organization_id = ? AND type = 'meeting_room' AND is_active = TRUE
       FOR UPDATE`,
      [location_id, orgId]
    );
    if (locations.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Pilih ruang meeting aktif milik organisasi ini.' });
    }

    const [eventConflicts] = await conn.query(
      `SELECT id FROM events
       WHERE location_id = ? AND status = 'published'
         AND start_at < ? AND COALESCE(end_at, DATE_ADD(start_at, INTERVAL 1 HOUR)) > ?
       LIMIT 1 FOR UPDATE`,
      [location_id, sqlEnd, sqlStart]
    );
    const [meetingConflicts] = await conn.query(
      `SELECT id FROM organization_meetings
       WHERE location_id = ? AND status = 'scheduled'
         AND start_at < ? AND end_at > ?
       LIMIT 1 FOR UPDATE`,
      [location_id, sqlEnd, sqlStart]
    );
    if (eventConflicts.length || meetingConflicts.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'Ruangan sudah memiliki event atau meeting pada waktu tersebut.' });
    }

    const [result] = await conn.query(
      `INSERT INTO organization_meetings
       (organization_id, location_id, created_by, title, description, start_at, end_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orgId, location_id, req.user.id, titleText, description?.trim() || null, sqlStart, sqlEnd]
    );

    await conn.commit();
    transactionStarted = false;
    res.status(201).json({ id: result.insertId, message: 'Meeting berhasil dijadwalkan.' });
  } catch (err) {
    if (conn && transactionStarted) await conn.rollback();
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

// PATCH /api/orgs/:id/meetings/:meetingId (Owner cancels a meeting)
router.patch('/:id/meetings/:meetingId', authMiddleware, async (req, res, next) => {
  try {
    if (req.body.action !== 'cancel') {
      return res.status(400).json({ error: "Action harus bernilai 'cancel'." });
    }

    const [result] = await pool.query(
      `UPDATE organization_meetings m
       JOIN organizations o ON o.id = m.organization_id
       SET m.status = 'cancelled'
       WHERE m.id = ? AND m.organization_id = ? AND o.owner_id = ? AND m.status = 'scheduled'`,
      [req.params.meetingId, req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Meeting tidak ditemukan atau sudah dibatalkan.' });
    }
    res.json({ message: 'Meeting berhasil dibatalkan.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/orgs/:id/events (Owner event workspace)
router.get('/:id/events', authMiddleware, async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const [orgRows] = await pool.query(
      'SELECT id, name, status FROM organizations WHERE id = ? AND owner_id = ?',
      [orgId, req.user.id]
    );

    if (orgRows.length === 0) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const [eventRows] = await pool.query(
      `SELECT e.id, e.organization_id, e.title, e.description, e.start_at, e.end_at,
              e.capacity, e.status, e.created_at, l.name AS location_name,
              COUNT(ea.id) AS application_count,
              COALESCE(SUM(CASE WHEN ea.status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_count,
              COALESCE(SUM(CASE WHEN ea.status = 'accepted' THEN 1 ELSE 0 END), 0) AS accepted_count,
              COALESCE(SUM(CASE WHEN ea.status = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected_count
       FROM events e
       LEFT JOIN locations l ON l.id = e.location_id
       LEFT JOIN event_applications ea ON ea.event_id = e.id
       WHERE e.organization_id = ?
       GROUP BY e.id, e.organization_id, e.title, e.description, e.start_at, e.end_at,
                e.capacity, e.status, e.created_at, l.name
       ORDER BY e.start_at DESC, e.id DESC`,
      [orgId]
    );

    res.json({
      organization: orgRows[0],
      events: eventRows.map((event) => ({
        ...event,
        application_count: Number(event.application_count),
        pending_count: Number(event.pending_count),
        accepted_count: Number(event.accepted_count),
        rejected_count: Number(event.rejected_count)
      }))
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orgs/:id/applications (Owner review queue across all events)
router.get('/:id/applications', authMiddleware, async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const [orgRows] = await pool.query(
      'SELECT id FROM organizations WHERE id = ? AND owner_id = ?',
      [orgId, req.user.id]
    );

    if (orgRows.length === 0) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const [applications] = await pool.query(
      `SELECT ea.id, ea.event_id, ea.user_id, ea.message, ea.status, ea.applied_at,
              e.title AS event_title, u.name, u.faculty, u.major
       FROM event_applications ea
       JOIN events e ON e.id = ea.event_id
       JOIN users u ON u.id = ea.user_id
       WHERE e.organization_id = ?
       ORDER BY ea.applied_at DESC, ea.id DESC`,
      [orgId]
    );

    res.json(applications);
  } catch (err) {
    next(err);
  }
});

// GET /api/orgs/:id (Public detail)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const [orgRows] = await pool.query(
      `SELECT o.id, o.owner_id, o.name, o.description, o.category, o.status, o.open_for_collab, o.verified_at,
              u.name AS owner_name
       FROM organizations o
       JOIN users u ON u.id = o.owner_id
       WHERE o.id = ?`,
      [orgId]
    );

    if (orgRows.length === 0) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const org = orgRows[0];

    // Upcoming events
    const [events] = await pool.query(
      `SELECT id, title, description, start_at, end_at, capacity, status
       FROM events
       WHERE organization_id = ? AND status = 'published' AND start_at >= NOW()
       ORDER BY start_at ASC
       LIMIT 50`,
      [orgId]
    );

    // Linked community
    const [communities] = await pool.query(
      `SELECT id, name, description, category
       FROM communities
       WHERE organization_id = ?
       LIMIT 1`,
      [orgId]
    );

    res.json({
      organization: {
        ...org,
        open_for_collab: Boolean(org.open_for_collab)
      },
      events,
      community: communities[0] || null,
      isOwner: org.owner_id === req.user.id
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orgs/:id (Owner manage description & open_for_collab)
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const userId = req.user.id;
    const { description, open_for_collab } = req.body;

    const [rows] = await pool.query('SELECT owner_id, status FROM organizations WHERE id = ?', [orgId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const org = rows[0];
    if (org.owner_id !== userId) {
      return res.status(403).json({ error: 'Only the organization owner can edit details.' });
    }

    const updates = [];
    const params = [];

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description ? description.trim() : null);
    }

    if (open_for_collab !== undefined) {
      if (org.status !== 'verified') {
        return res.status(403).json({ error: 'Only verified organizations can open for collaboration.' });
      }
      updates.push('open_for_collab = ?');
      params.push(Boolean(open_for_collab));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    params.push(orgId);
    await pool.query(`UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'Organization updated successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
