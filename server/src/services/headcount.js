const pool = require('../db');

/**
 * Returns active headcount and active groups per location.
 * Active group definition: status IN ('open', 'full') AND scheduled_at BETWEEN NOW() - 3h AND NOW() + 1h
 */
async function getLiveLocations() {
  const query = `
    SELECT l.id, l.name, l.type, l.short_description, l.description, l.address,
           CAST(l.latitude AS DOUBLE) AS latitude,
           CAST(l.longitude AS DOUBLE) AS longitude,
           COUNT(DISTINCT g.id) AS active_groups,
           COUNT(m.user_id)     AS active_people
    FROM locations l
    LEFT JOIN study_groups g
           ON g.location_id = l.id
          AND g.status IN ('open','full')
          AND g.scheduled_at BETWEEN NOW() - INTERVAL 3 HOUR AND NOW() + INTERVAL 1 HOUR
    LEFT JOIN study_group_members m ON m.group_id = g.id
    WHERE l.is_active = TRUE
    GROUP BY l.id
  `;

  const [rows] = await pool.query(query);
  return rows.map(r => ({
    ...r,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    active_groups: Number(r.active_groups),
    active_people: Number(r.active_people)
  }));
}

module.exports = {
  getLiveLocations
};
