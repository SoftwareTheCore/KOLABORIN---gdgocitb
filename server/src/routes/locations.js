const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { getLiveLocations } = require('../services/headcount');

const router = express.Router();

// GET /api/locations/live (Auth)
router.get('/live', authMiddleware, async (req, res, next) => {
  try {
    const locations = await getLiveLocations();
    res.json(locations);
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
