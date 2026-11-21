/**
 * Badge Eligibility Checker as specified in PRD Section 8.2
 * Checks whether user qualifies for 'Database Systems Expert' badge after an answer.
 */
async function checkBadgeEligibility(conn, userId, subject) {
  // Currently seeded badge: Database Systems Expert (min_answers = 5)
  const [badgeRows] = await conn.query(
    'SELECT id, name, min_answers FROM badges WHERE subject = ?',
    [subject]
  );
  if (badgeRows.length === 0) {
    return { eligible: false, badgeRequested: false };
  }

  const badge = badgeRows[0];

  // Count answers posted by this user in groups of this subject
  const [countRows] = await conn.query(
    `SELECT COUNT(p.id) AS answer_count
     FROM group_posts p
     JOIN study_groups g ON g.id = p.group_id
     WHERE p.user_id = ? AND p.type = 'answer' AND g.subject = ?`,
    [userId, subject]
  );
  const count = Number(countRows[0].answer_count);

  if (count >= badge.min_answers) {
    // Check if user already has this badge (approved or pending)
    const [existing] = await conn.query(
      'SELECT id, status FROM user_badges WHERE user_id = ? AND badge_id = ?',
      [userId, badge.id]
    );

    if (existing.length === 0) {
      await conn.query(
        `INSERT INTO user_badges (user_id, badge_id, status)
         VALUES (?, ?, 'pending')`,
        [userId, badge.id]
      );
      return { eligible: true, badgeRequested: true, badgeName: badge.name };
    }
  }

  return { eligible: false, badgeRequested: false, currentCount: count };
}

module.exports = {
  checkBadgeEligibility
};
