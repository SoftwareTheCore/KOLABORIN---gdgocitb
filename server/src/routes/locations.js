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
      `SELECT id, name, type, address, latitude, longitude, short_description
       FROM locations
       WHERE is_active = TRUE
       ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
