const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/badges (List all available badge definitions)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, subject, description, min_answers FROM badges ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/badges/mine (Caller's badges with status)
router.get('/mine', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT ub.id, ub.badge_id, ub.status, ub.requested_at, ub.approved_at,
              b.name, b.subject, b.description
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = ?
       ORDER BY ub.requested_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
