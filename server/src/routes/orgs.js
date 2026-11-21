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
