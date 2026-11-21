const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/collab-requests (Verified org owner sends collaboration request)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from_org_id, to_org_id, message } = req.body;

    if (!from_org_id || !to_org_id || !message || !message.trim()) {
      return res.status(400).json({ error: 'Origin organization, target organization, and message are required.' });
    }

    if (parseInt(from_org_id, 10) === parseInt(to_org_id, 10)) {
      return res.status(400).json({ error: 'Cannot send collaboration request to your own organization.' });
    }

    // Verify sender owns from_org and it is verified
    const [fromRows] = await pool.query(
      'SELECT owner_id, status FROM organizations WHERE id = ?',
      [from_org_id]
    );
    if (fromRows.length === 0 || fromRows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'You do not own the sending organization.' });
    }
    if (fromRows[0].status !== 'verified') {
      return res.status(403).json({ error: 'Sending organization must be verified.' });
    }

    // Verify target organization is verified and open_for_collab
    const [toRows] = await pool.query(
      'SELECT open_for_collab, status FROM organizations WHERE id = ?',
      [to_org_id]
    );
    if (toRows.length === 0) {
      return res.status(404).json({ error: 'Target organization not found.' });
    }
    if (toRows[0].status !== 'verified' || !toRows[0].open_for_collab) {
      return res.status(400).json({ error: 'Target organization is not open for collaboration.' });
    }

    const [result] = await pool.query(
      `INSERT INTO collaboration_requests (from_org_id, to_org_id, message, status)
       VALUES (?, ?, ?, 'pending')`,
      [from_org_id, to_org_id, message.trim()]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Collaboration request sent successfully!',
      status: 'pending'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/collab-requests/inbox (Requests to organizations owned by the user)
router.get('/inbox', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT cr.id, cr.from_org_id, cr.to_org_id, cr.message, cr.status, cr.created_at,
              from_org.name AS from_org_name,
              to_org.name AS to_org_name,
              sender.name AS sender_name,
              sender.email AS sender_email
       FROM collaboration_requests cr
       JOIN organizations from_org ON from_org.id = cr.from_org_id
       JOIN organizations to_org ON to_org.id = cr.to_org_id
       JOIN users sender ON sender.id = from_org.owner_id
       WHERE to_org.owner_id = ?
       ORDER BY cr.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/collab-requests/:id (Receiving owner accept or decline)
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;
    const { action } = req.body; // 'accept' or 'decline'

    if (action !== 'accept' && action !== 'decline') {
      return res.status(400).json({ error: "Action must be 'accept' or 'decline'." });
    }

    // Verify receiving owner
    const [rows] = await pool.query(
      `SELECT cr.id, to_org.owner_id
       FROM collaboration_requests cr
       JOIN organizations to_org ON to_org.id = cr.to_org_id
       WHERE cr.id = ?`,
      [requestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Collaboration request not found.' });
    }

    if (rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only the receiving organization owner can respond.' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    const [result] = await pool.query(
      `UPDATE collaboration_requests
       SET status = ?
       WHERE id = ? AND status = 'pending'`,
      [newStatus, requestId]
    );
    if (result.affectedRows === 0) {
      return res.status(409).json({ error: 'Only pending collaboration requests can be reviewed.' });
    }

    res.json({ message: `Collaboration request ${newStatus}.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
