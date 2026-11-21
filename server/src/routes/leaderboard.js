const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/leaderboard (Auth - top 20 students plus caller's row)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Get Top 20 students from leaderboard view
    const [topRows] = await pool.query(
      `SELECT user_id, name, faculty, total_points, rank_no
       FROM leaderboard
       ORDER BY rank_no ASC
       LIMIT 20`
    );

    // 2. Get current user row
    const [myRow] = await pool.query(
      `SELECT user_id, name, faculty, total_points, rank_no
       FROM leaderboard
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      leaderboard: topRows,
      me: myRow[0] || null
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
