/**
 * Points Engine as specified in PRD Section 8.1
 * Award points safely within the same database connection/transaction.
 */
async function awardPoints(conn, userId, actionType, options = {}) {
  const { groupId = null } = options;

  await conn.query(
    'SELECT id FROM users WHERE id = ? FOR UPDATE',
    [userId]
  );

  // 1. Read rule
  const [ruleRows] = await conn.query(
    'SELECT points, daily_cap_points FROM point_rules WHERE action_type = ?',
    [actionType]
  );
  if (ruleRows.length === 0) {
    return { awarded: 0, capped: false, total: 0 };
  }
  const rule = ruleRows[0];

  // Anti-abuse: leaving and rejoining the same group gives no new points
  if (actionType === 'join_group' && groupId) {
    const [existingTx] = await conn.query(
      `SELECT id FROM point_transactions
       WHERE user_id = ? AND action_type = 'join_group' AND group_id = ?`,
      [userId, groupId]
    );
    if (existingTx.length > 0) {
      const [[userRow]] = await conn.query('SELECT total_points FROM users WHERE id = ?', [userId]);
      return { awarded: 0, capped: false, duplicate: true, total: userRow ? userRow.total_points : 0 };
    }
  }

  // 2. Sum points earned today for this action
  const [sumRows] = await conn.query(
    `SELECT COALESCE(SUM(points), 0) AS todaySum
     FROM point_transactions
     WHERE user_id = ? AND action_type = ? AND DATE(created_at) = CURDATE()`,
    [userId, actionType]
  );
  const todaySum = Number(sumRows[0].todaySum);

  // 3. Check remaining cap
  const remaining = rule.daily_cap_points - todaySum;
  if (remaining <= 0) {
    const [[userRow]] = await conn.query('SELECT total_points FROM users WHERE id = ?', [userId]);
    return { awarded: 0, capped: true, total: userRow ? userRow.total_points : 0 };
  }

  // 4. Calculate award
  const award = Math.min(rule.points, remaining);

  // 5. Insert transaction & update users.total_points
  await conn.query(
    `INSERT INTO point_transactions (user_id, action_type, points, group_id)
     VALUES (?, ?, ?, ?)`,
    [userId, actionType, award, groupId]
  );

  await conn.query(
    'UPDATE users SET total_points = total_points + ? WHERE id = ?',
    [award, userId]
  );

  const [[userRow]] = await conn.query('SELECT total_points FROM users WHERE id = ?', [userId]);

  return {
    awarded: award,
    capped: award < rule.points,
    total: userRow ? userRow.total_points : 0
  };
}

module.exports = {
  awardPoints
};
