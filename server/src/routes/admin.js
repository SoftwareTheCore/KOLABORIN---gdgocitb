const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Enforce admin role for all routes in this router
router.use(authMiddleware);
router.use(requireRole('admin'));

// GET /api/admin/locations (Active places available in Campus Radar)
router.get('/locations', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.id, l.name, l.type, l.address, l.short_description,
              COALESCE(r.rating, 0) AS rating, COALESCE(r.rating_count, 0) AS rating_count
       FROM locations l
       LEFT JOIN (
         SELECT location_id, ROUND(AVG(rating), 1) AS rating, COUNT(*) AS rating_count
         FROM location_ratings GROUP BY location_id
       ) r ON r.location_id = l.id
       WHERE l.is_active = TRUE
       ORDER BY l.name`
    );
    res.json(rows.map(row => ({
      ...row,
      rating: Number(row.rating),
      rating_count: Number(row.rating_count)
    })));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/locations/:id (Hide a place without breaking existing events/groups)
router.delete('/locations/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'UPDATE locations SET is_active = FALSE WHERE id = ? AND is_active = TRUE',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Active location not found.' });
    }
    res.json({ message: 'Lokasi dihapus dari Campus Radar.' });
  } catch (err) {
    next(err);
  }
});

// --- 1. ORGANIZATIONS QUEUE ---

// GET /api/admin/orgs/pending
router.get('/orgs/pending', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.id, o.name, o.description, o.category, o.status, o.created_at,
              u.name AS owner_name, u.email AS owner_email, u.faculty, u.major
       FROM organizations o
       JOIN users u ON u.id = o.owner_id
       WHERE o.status = 'pending'
       ORDER BY o.created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orgs/:id (Verify or reject organization)
router.patch('/orgs/:id', async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const adminId = req.user.id;
    const { action } = req.body; // 'verify' or 'reject'

    if (action !== 'verify' && action !== 'reject') {
      return res.status(400).json({ error: "Action must be 'verify' or 'reject'." });
    }

    const newStatus = action === 'verify' ? 'verified' : 'rejected';
    const [result] = await pool.query(
      `UPDATE organizations
       SET status = ?, verified_by = ?, verified_at = NOW()
       WHERE id = ? AND status = 'pending'`,
      [newStatus, adminId, orgId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    res.json({ message: `Organization ${newStatus} successfully.` });
  } catch (err) {
    next(err);
  }
});

// --- 2. BADGES QUEUE ---

// GET /api/admin/badges/pending
router.get('/badges/pending', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT ub.id, ub.user_id, ub.badge_id, ub.status, ub.requested_at,
              u.name AS user_name, u.faculty, u.major,
              b.name AS badge_name, b.subject, b.description AS badge_description,
              (SELECT COUNT(*) FROM group_posts p JOIN study_groups g ON g.id = p.group_id WHERE p.user_id = ub.user_id AND p.type = 'answer' AND g.subject = b.subject) AS answer_count
       FROM user_badges ub
       JOIN users u ON u.id = ub.user_id
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.status = 'pending'
       ORDER BY ub.requested_at ASC`
    );
    res.json(rows.map(r => ({
      ...r,
      answer_count: Number(r.answer_count)
    })));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/badges/:id
router.patch('/badges/:id', async (req, res, next) => {
  try {
    const badgeReqId = req.params.id;
    const adminId = req.user.id;
    const { action } = req.body; // 'approve' or 'reject'

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: "Action must be 'approve' or 'reject'." });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const [result] = await pool.query(
      `UPDATE user_badges
       SET status = ?, approved_by = ?, approved_at = NOW()
       WHERE id = ? AND status = 'pending'`,
      [newStatus, adminId, badgeReqId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Badge request not found.' });
    }

    res.json({ message: `Badge ${newStatus} successfully.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
