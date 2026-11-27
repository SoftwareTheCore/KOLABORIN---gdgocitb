const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { getLiveLocations } = require('../services/headcount');

const router = express.Router();

// GET /api/locations/live (Auth)
router.get('/live', authMiddleware, async (req, res, next) => {
  try {
    const locations = await getLiveLocations(req.user.id);
    res.json(locations);
  } catch (err) {
    next(err);
  }
});

// POST /api/locations/:id/rating (Upsert the signed-in user's place rating)
router.post('/:id/rating', authMiddleware, async (req, res, next) => {
  try {
    const rating = req.body.rating;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5.' });
    }

    const [locations] = await pool.query(
      'SELECT id FROM locations WHERE id = ? AND is_active = TRUE',
      [req.params.id]
    );
    if (locations.length === 0) {
      return res.status(404).json({ error: 'Active location not found.' });
    }

    await pool.query(
      `INSERT INTO location_ratings (location_id, user_id, rating)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [req.params.id, req.user.id, rating]
    );

    const [[summary]] = await pool.query(
      `SELECT ROUND(AVG(rating), 1) AS rating, COUNT(*) AS rating_count
       FROM location_ratings WHERE location_id = ?`,
      [req.params.id]
    );
    res.json({
      rating: Number(summary.rating),
      rating_count: Number(summary.rating_count),
      user_rating: rating
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/locations (Plain list for dropdowns)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.id, l.name, l.type, l.address, l.latitude, l.longitude,
              l.description, l.short_description,
              COALESCE(ROUND(AVG(r.rating), 1), 0) AS rating,
              COUNT(r.user_id) AS rating_count,
              MAX(CASE WHEN r.user_id = ? THEN r.rating END) AS user_rating
       FROM locations l
       LEFT JOIN location_ratings r ON r.location_id = l.id
       WHERE l.is_active = TRUE
       GROUP BY l.id
       ORDER BY l.name ASC`,
      [req.user.id]
    );
    res.json(rows.map((row) => ({
      ...row,
      rating: Number(row.rating),
      rating_count: Number(row.rating_count),
      user_rating: row.user_rating === null ? null : Number(row.user_rating)
    })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
