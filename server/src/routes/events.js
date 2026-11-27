const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { awardPoints } = require('../services/points');

const router = express.Router();

// GET /api/events (Browse published upcoming events)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT e.id, e.organization_id, e.title, e.description, e.location_id,
             e.start_at, e.end_at, e.capacity, e.status, e.created_at,
             o.name AS org_name, o.status AS org_status,
             l.name AS location_name,
             ea.status AS my_status,
             (SELECT COUNT(*) FROM event_applications WHERE event_id = e.id AND status = 'accepted') AS accepted_count
      FROM events e
      JOIN organizations o ON o.id = e.organization_id
      LEFT JOIN locations l ON l.id = e.location_id
      LEFT JOIN event_applications ea ON ea.event_id = e.id AND ea.user_id = ?
      WHERE e.status = 'published' AND e.start_at >= NOW()
      ORDER BY e.start_at ASC
      LIMIT 50
    `;

    const [rows] = await pool.query(query, [userId]);
    res.json(rows.map(r => ({
      ...r,
      accepted_count: Number(r.accepted_count)
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id (Detail + myApplication + counts)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const [eventRows] = await pool.query(
      `SELECT e.id, e.organization_id, e.title, e.description, e.location_id,
              e.start_at, e.end_at, e.capacity, e.status, e.created_at,
              o.name AS org_name, o.owner_id AS org_owner_id, o.status AS org_status,
              l.name AS location_name, l.address AS location_address,
              CAST(l.latitude AS DOUBLE) AS latitude,
              CAST(l.longitude AS DOUBLE) AS longitude
       FROM events e
       JOIN organizations o ON o.id = e.organization_id
       LEFT JOIN locations l ON l.id = e.location_id
       WHERE e.id = ?`,
      [eventId]
    );

    if (eventRows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = eventRows[0];

    const [appRows] = await pool.query(
      'SELECT id, message, status, applied_at, checked_in_at FROM event_applications WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    const [[countRow]] = await pool.query(
      "SELECT COUNT(*) AS accepted_count FROM event_applications WHERE event_id = ? AND status = 'accepted'",
      [eventId]
    );

    res.json({
      event,
      myApplication: appRows[0] || null,
      acceptedCount: countRow.accepted_count,
      isOwner: event.org_owner_id === userId
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id/ticket (Accepted student retrieves their event QR ticket)
router.get('/:id/ticket', authMiddleware, async (req, res, next) => {
  let conn;
  let transactionStarted = false;
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Hanya peserta yang dapat mengambil tiket event.' });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();
    transactionStarted = true;
    const [applicationRows] = await conn.query(
      `SELECT ea.id, ea.status, ea.ticket_code, e.status AS event_status
       FROM event_applications ea
       JOIN events e ON e.id = ea.event_id
       WHERE ea.event_id = ? AND ea.user_id = ?
       FOR UPDATE`,
      [req.params.id, req.user.id]
    );

    if (applicationRows.length === 0) {
      await conn.rollback();
      transactionStarted = false;
      return res.status(404).json({ error: 'Pendaftaran event tidak ditemukan.' });
    }

    const application = applicationRows[0];
    if (application.status !== 'accepted' || application.event_status !== 'published') {
      await conn.rollback();
      transactionStarted = false;
      return res.status(409).json({ error: 'Tiket QR tersedia setelah pendaftaran diterima.' });
    }

    const ticketCode = application.ticket_code || crypto.randomBytes(32).toString('hex');
    if (!application.ticket_code) {
      await conn.query(
        'UPDATE event_applications SET ticket_code = ? WHERE id = ?',
        [ticketCode, application.id]
      );
    }

    await conn.commit();
    transactionStarted = false;
    res.json({ ticketCode });
  } catch (err) {
    if (conn && transactionStarted) await conn.rollback();
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/events (Verified org owner only)
router.post('/', authMiddleware, async (req, res, next) => {
  let conn;
  let transactionStarted = false;
  try {
    if (req.user.role !== 'organization') {
      return res.status(403).json({ error: 'Only organization accounts can publish events.' });
    }
    const userId = req.user.id;
    const { organization_id, title, description, location_id, start_at, end_at, capacity } = req.body;

    if (!organization_id || !title || !start_at) {
      return res.status(400).json({ error: 'Organization, title, and start time are required.' });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();
    transactionStarted = true;
    const [orgRows] = await conn.query(
      'SELECT owner_id, status FROM organizations WHERE id = ? FOR UPDATE',
      [organization_id]
    );

    if (orgRows.length === 0) {
      await conn.rollback();
      transactionStarted = false;
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const org = orgRows[0];
    if (org.owner_id !== userId) {
      await conn.rollback();
      transactionStarted = false;
      return res.status(403).json({ error: 'Only the organization owner can publish events.' });
    }

    if (org.status !== 'verified') {
      await conn.rollback();
      transactionStarted = false;
      return res.status(403).json({ error: 'Cannot publish event: organization is pending admin verification.' });
    }

    if (location_id) {
      const [locations] = await conn.query(
        'SELECT id FROM locations WHERE id = ? FOR UPDATE',
        [location_id]
      );
      if (locations.length === 0) {
        await conn.rollback();
        transactionStarted = false;
        return res.status(400).json({ error: 'Selected event location does not exist.' });
      }

      const eventEnd = end_at || null;
      const [meetingConflicts] = await conn.query(
        `SELECT id FROM organization_meetings
         WHERE location_id = ? AND status = 'scheduled'
           AND start_at < COALESCE(?, DATE_ADD(?, INTERVAL 1 HOUR))
           AND end_at > ?
         LIMIT 1`,
        [location_id, eventEnd, start_at, start_at]
      );
      if (meetingConflicts.length > 0) {
        await conn.rollback();
        transactionStarted = false;
        return res.status(409).json({ error: 'Ruangan sudah digunakan untuk meeting pada waktu tersebut.' });
      }
    }

    const [result] = await conn.query(
      `INSERT INTO events (organization_id, title, description, location_id, start_at, end_at, capacity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
      [
        organization_id,
        title.trim(),
        description ? description.trim() : null,
        location_id || null,
        start_at,
        end_at || null,
        capacity ? parseInt(capacity, 10) : null
      ]
    );

    await conn.commit();
    transactionStarted = false;
    res.status(201).json({
      id: result.insertId,
      message: 'Event published successfully.'
    });
  } catch (err) {
    if (conn && transactionStarted) await conn.rollback();
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/events/:id/apply (Student apply to event)
router.post('/:id/apply', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can apply to events.' });
    }
    const eventId = req.params.id;
    const userId = req.user.id;
    const { message } = req.body;

    const [eventRows] = await pool.query(
      `SELECT e.id, e.status, o.owner_id AS org_owner_id
       FROM events e
       JOIN organizations o ON o.id = e.organization_id
       WHERE e.id = ?`,
      [eventId]
    );

    if (eventRows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = eventRows[0];

    if (event.status !== 'published') {
      return res.status(409).json({ error: 'This event is not open for applications.' });
    }

    // Cannot apply to own organization's event
    if (event.org_owner_id === userId) {
      return res.status(403).json({ error: 'Cannot apply to an event hosted by your own organization.' });
    }

    // Check duplicate
    const [existing] = await pool.query(
      'SELECT id FROM event_applications WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already applied to this event.' });
    }

    const [result] = await pool.query(
      `INSERT INTO event_applications (event_id, user_id, message, status)
       VALUES (?, ?, ?, 'pending')`,
      [eventId, userId, message ? message.trim() : null]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Application submitted successfully.',
      status: 'pending'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id/applications (Event owner review applicants)
router.get('/:id/applications', authMiddleware, async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Verify owner
    const [eventRows] = await pool.query(
      `SELECT e.id, o.owner_id
       FROM events e
       JOIN organizations o ON o.id = e.organization_id
       WHERE e.id = ?`,
      [eventId]
    );

    if (eventRows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (eventRows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only event owners can view applicants.' });
    }

    const [applicants] = await pool.query(
      `SELECT ea.id, ea.user_id, ea.message, ea.status, ea.applied_at, ea.checked_in_at,
              u.name, u.faculty, u.major
       FROM event_applications ea
       JOIN users u ON u.id = ea.user_id
       WHERE ea.event_id = ?
       ORDER BY ea.applied_at ASC`,
      [eventId]
    );

    res.json(applicants);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:id/check-ins (Event owner checks in an accepted ticket)
router.post('/:id/check-ins', authMiddleware, async (req, res, next) => {
  let conn;
  let transactionStarted = false;
  try {
    if (req.user.role !== 'organization') {
      return res.status(403).json({ error: 'Hanya organisasi yang dapat memvalidasi tiket.' });
    }
    const ticketCode = typeof req.body.ticket_code === 'string'
      ? req.body.ticket_code.trim()
      : '';
    if (!/^[a-f0-9]{64}$/i.test(ticketCode)) {
      return res.status(400).json({ error: 'Kode tiket QR tidak valid.' });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();
    transactionStarted = true;
    const [ticketRows] = await conn.query(
      `SELECT ea.id, ea.status, ea.checked_in_at, u.name, u.faculty, u.major,
              e.title AS event_title, e.status AS event_status, o.owner_id
       FROM event_applications ea
       JOIN events e ON e.id = ea.event_id
       JOIN organizations o ON o.id = e.organization_id
       JOIN users u ON u.id = ea.user_id
       WHERE ea.event_id = ? AND ea.ticket_code = ?
       FOR UPDATE`,
      [req.params.id, ticketCode]
    );

    if (ticketRows.length === 0) {
      await conn.rollback();
      transactionStarted = false;
      return res.status(404).json({ error: 'Tiket tidak ditemukan untuk event ini.' });
    }

    const ticket = ticketRows[0];
    if (ticket.owner_id !== req.user.id) {
      await conn.rollback();
      transactionStarted = false;
      return res.status(403).json({ error: 'Hanya pemilik event yang dapat melakukan check-in.' });
    }
    if (ticket.event_status !== 'published') {
      await conn.rollback();
      transactionStarted = false;
      return res.status(409).json({ error: 'Check-in hanya tersedia untuk event yang dipublikasikan.' });
    }
    if (ticket.status !== 'accepted') {
      await conn.rollback();
      transactionStarted = false;
      return res.status(409).json({ error: 'Hanya peserta yang diterima dapat melakukan check-in.' });
    }
    if (ticket.checked_in_at) {
      await conn.rollback();
      transactionStarted = false;
      return res.status(409).json({
        error: 'Tiket ini sudah digunakan untuk check-in.',
        attendee: {
          name: ticket.name,
          checked_in_at: ticket.checked_in_at
        }
      });
    }

    await conn.query(
      'UPDATE event_applications SET checked_in_at = NOW(), checked_in_by = ? WHERE id = ?',
      [req.user.id, ticket.id]
    );
    const [[checkedIn]] = await conn.query(
      'SELECT checked_in_at FROM event_applications WHERE id = ?',
      [ticket.id]
    );
    await conn.commit();
    transactionStarted = false;
    res.json({
      message: 'Check-in berhasil.',
      attendee: {
        name: ticket.name,
        faculty: ticket.faculty,
        major: ticket.major,
        event_title: ticket.event_title,
        checked_in_at: checkedIn.checked_in_at
      }
    });
  } catch (err) {
    if (conn && transactionStarted) await conn.rollback();
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

// PATCH /api/events/applications/:id (Accept/reject applicant with capacity check & points)
router.patch('/applications/:id', authMiddleware, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const appId = req.params.id;
    const userId = req.user.id;
    const { action } = req.body; // 'accept' or 'reject'

    if (action !== 'accept' && action !== 'reject') {
      await conn.rollback();
      return res.status(400).json({ error: "Action must be 'accept' or 'reject'." });
    }

    // Find application & verify event owner
    const [appRows] = await conn.query(
      `SELECT ea.id, ea.event_id, ea.user_id, ea.status,
              e.capacity, o.owner_id
       FROM event_applications ea
       JOIN events e ON e.id = ea.event_id
       JOIN organizations o ON o.id = e.organization_id
       WHERE ea.id = ? FOR UPDATE`,
      [appId]
    );

    if (appRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Application not found.' });
    }

    const app = appRows[0];
    if (app.owner_id !== userId) {
      await conn.rollback();
      return res.status(403).json({ error: 'Only event owners can manage applications.' });
    }

    if (app.status !== 'pending') {
      await conn.rollback();
      return res.status(409).json({ error: 'Only pending applications can be reviewed.' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    if (newStatus === 'accepted') {
      const [[eventRow]] = await conn.query(
        'SELECT capacity FROM events WHERE id = ? FOR UPDATE',
        [app.event_id]
      );

      // Check event capacity
      if (eventRow.capacity !== null) {
        const [[countRow]] = await conn.query(
          "SELECT COUNT(*) AS accepted_count FROM event_applications WHERE event_id = ? AND status = 'accepted'",
          [app.event_id]
        );
        if (countRow.accepted_count >= eventRow.capacity) {
          await conn.rollback();
          return res.status(409).json({ error: 'Event capacity reached. Cannot accept more applicants.' });
        }
      }

      // Update status
      await conn.query(
        `UPDATE event_applications
         SET status = 'accepted', ticket_code = COALESCE(ticket_code, ?)
         WHERE id = ?`,
        [crypto.randomBytes(32).toString('hex'), appId]
      );

      // Award points to applicant: attend_event (+20 points)
      await awardPoints(conn, app.user_id, 'attend_event');
    } else {
      await conn.query("UPDATE event_applications SET status = 'rejected' WHERE id = ?", [appId]);
    }

    await conn.commit();
    res.json({ message: `Applicant ${newStatus} successfully.` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
