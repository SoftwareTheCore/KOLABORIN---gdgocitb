require('dotenv').config();
const mysql = require('mysql2/promise');
const { locations, demoRatings } = require('./campusRadarData');

const demoUserEmails = [
  'mikail@kolaborin.test',
  'farrel@kolaborin.test',
  'rani@kolaborin.test'
];

async function seedCampusRadar() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kolaborin',
    timezone: '+07:00'
  });
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const activePlaces = [];
    let insertedPlaces = 0;
    let insertedRatings = 0;

    for (const [index, place] of locations.entries()) {
      const [existingRows] = await connection.query(
        'SELECT id, is_active FROM locations WHERE name = ? LIMIT 1',
        [place.name]
      );
      if (existingRows.length > 0) {
        if (existingRows[0].is_active) activePlaces.push({ id: existingRows[0].id, index });
        continue;
      }

      const [result] = await connection.query(
        `INSERT INTO locations
         (name, type, address, latitude, longitude, description, short_description, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [place.name, place.type, place.address, place.lat, place.lng, place.desc, place.short]
      );
      activePlaces.push({ id: result.insertId, index });
      insertedPlaces += 1;
    }

    const [demoUsers] = await connection.query(
      'SELECT id, email FROM users WHERE email IN (?, ?, ?)',
      demoUserEmails
    );
    const userIds = new Map(demoUsers.map((user) => [user.email, user.id]));

    for (const place of activePlaces) {
      for (const [ratingIndex, email] of demoUserEmails.entries()) {
        const userId = userIds.get(email);
        if (!userId) continue;

        const [result] = await connection.query(
          'INSERT IGNORE INTO location_ratings (location_id, user_id, rating) VALUES (?, ?, ?)',
          [place.id, userId, demoRatings[place.index][ratingIndex]]
        );
        insertedRatings += result.affectedRows;
      }
    }

    await connection.commit();
    console.log(JSON.stringify({
      seededPlaces: activePlaces.length,
      insertedPlaces,
      insertedRatings
    }));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

seedCampusRadar().catch((error) => {
  console.error('Campus Radar seeding failed:', error);
  process.exitCode = 1;
});
