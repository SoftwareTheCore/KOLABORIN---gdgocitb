const pool = require('../db');

/**
 * Returns active headcount and active groups per location.
 * Active group definition: status IN ('open', 'full') AND scheduled_at BETWEEN NOW() - 3h AND NOW() + 1h
 */
async function getLiveLocations(userId = null) {
  const query = `
    SELECT l.id, l.name, l.type, l.short_description, l.description, l.address,
           CAST(l.latitude AS DOUBLE) AS latitude,
           CAST(l.longitude AS DOUBLE) AS longitude,
           COUNT(DISTINCT g.id) AS active_groups,
           COUNT(m.user_id) AS active_people,
           COALESCE(r.rating, 0) AS rating,
           COALESCE(r.rating_count, 0) AS rating_count,
           mine.rating AS user_rating
    FROM locations l
    LEFT JOIN (
      SELECT location_id, ROUND(AVG(rating), 1) AS rating, COUNT(*) AS rating_count
      FROM location_ratings
      GROUP BY location_id
    ) r ON r.location_id = l.id
    LEFT JOIN location_ratings mine
           ON mine.location_id = l.id AND mine.user_id = ?
    LEFT JOIN study_groups g
           ON g.location_id = l.id
          AND g.status IN ('open','full')
          AND g.scheduled_at BETWEEN NOW() - INTERVAL 3 HOUR AND NOW() + INTERVAL 1 HOUR
    LEFT JOIN study_group_members m ON m.group_id = g.id
    WHERE l.is_active = TRUE
    GROUP BY l.id, r.rating, r.rating_count, mine.rating
  `;

  const [rows] = await pool.query(query, [userId]);
  return rows.map(r => ({
    ...r,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    active_groups: Number(r.active_groups),
    active_people: Number(r.active_people),
    rating: Number(r.rating),
    rating_count: Number(r.rating_count),
    user_rating: r.user_rating == null ? null : Number(r.user_rating)
  }));
}

module.exports = {
  getLiveLocations
};
