const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Enforce admin role for all routes in this router
router.use(authMiddleware);
router.use(requireRole('admin'));

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

// --- 2. PLACES QUEUE ---

// GET /api/admin/place-requests/pending
router.get('/place-requests/pending', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT pr.id, pr.requester_id, pr.name, pr.type, pr.address,
              CAST(pr.latitude AS DOUBLE) AS latitude,
              CAST(pr.longitude AS DOUBLE) AS longitude,
              pr.short_description, pr.status, pr.created_at,
              u.name AS requester_name, u.faculty, u.major
       FROM place_requests pr
       JOIN users u ON u.id = pr.requester_id
       WHERE pr.status = 'pending'
       ORDER BY pr.created_at ASC`
    );
    res.json(rows.map(r => ({
      ...r,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude)
    })));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/place-requests/:id (Approve inserts into locations in same transaction)
router.patch('/place-requests/:id', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const requestId = req.params.id;
    const adminId = req.user.id;
    const { action } = req.body; // 'approve' or 'reject'

    if (action !== 'approve' && action !== 'reject') {
      await conn.rollback();
      return res.status(400).json({ error: "Action must be 'approve' or 'reject'." });
    }

    const [rows] = await conn.query(
      'SELECT * FROM place_requests WHERE id = ? FOR UPDATE',
      [requestId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Place request not found.' });
    }

    const pr = rows[0];

    if (pr.status !== 'pending') {
      await conn.rollback();
      return res.status(409).json({ error: 'Only pending place requests can be reviewed.' });
    }

    if (action === 'approve') {
      // 1. Update place_requests
      await conn.query(
        `UPDATE place_requests
         SET status = 'approved', reviewed_by = ?, reviewed_at = NOW()
         WHERE id = ?`,
        [adminId, requestId]
      );

      // 2. Insert into locations
      await conn.query(
        `INSERT INTO locations
         (name, type, address, latitude, longitude, description, short_description, owner_id, organization_id, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          pr.name,
          pr.type,
          pr.address,
          pr.latitude,
          pr.longitude,
          pr.short_description,
          pr.short_description,
          pr.requester_id,
          pr.organization_id
        ]
      );
    } else {
      await conn.query(
        `UPDATE place_requests
         SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW()
         WHERE id = ?`,
        [adminId, requestId]
      );
    }

    await conn.commit();
    res.json({ message: `Place request ${action}d successfully.` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// --- 3. BADGES QUEUE ---

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
