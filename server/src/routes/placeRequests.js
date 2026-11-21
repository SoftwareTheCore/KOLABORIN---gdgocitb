const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/place-requests (Auth)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const requesterId = req.user.id;
    const { name, type, address, latitude, longitude, short_description, organization_id } = req.body;

    if (!name || !type || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Name, type, latitude, and longitude are required.' });
    }

    const validTypes = ['study_spot', 'meeting_room', 'event_venue'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid place type.' });
    }

    const [result] = await pool.query(
      `INSERT INTO place_requests
       (requester_id, name, type, address, latitude, longitude, short_description, organization_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        requesterId,
        name.trim(),
        type,
        address ? address.trim() : null,
        latitude,
        longitude,
        short_description ? short_description.slice(0, 200).trim() : null,
        organization_id || null
      ]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Place request submitted for admin review.',
      status: 'pending'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/place-requests/mine (Auth - returns user's own requests with status)
router.get('/mine', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, type, address,
              CAST(latitude AS DOUBLE) AS latitude,
              CAST(longitude AS DOUBLE) AS longitude,
              short_description, status, created_at
       FROM place_requests
       WHERE requester_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
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

module.exports = router;
