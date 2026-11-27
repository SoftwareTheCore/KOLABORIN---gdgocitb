const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. User info & rank
    const [userRows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.faculty, u.major, u.bio, u.avatar_data, u.total_points, u.created_at,
              (SELECT COUNT(*) FROM study_group_membership_history mh WHERE mh.user_id = u.id) AS groups_joined_count,
              COALESCE(l.rank_no, 0) AS \`rank\`
       FROM users u
       LEFT JOIN leaderboard l ON l.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];

    // 2. Approved badges
    const [badgeRows] = await pool.query(
      `SELECT b.id, b.name, b.subject, b.description, ub.approved_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = ? AND ub.status = 'approved'`,
      [userId]
    );

    // 3. Owned organizations
    const [orgRows] = await pool.query(
      `SELECT id, name, category, status, open_for_collab
       FROM organizations
       WHERE owner_id = ?`,
      [userId]
    );

    // 4. Today caps per action
    const [ruleRows] = await pool.query('SELECT action_type, points, daily_cap_points FROM point_rules');
    const [txRows] = await pool.query(
      `SELECT action_type, SUM(points) as earned_today
       FROM point_transactions
       WHERE user_id = ? AND DATE(created_at) = CURDATE()
       GROUP BY action_type`,
      [userId]
    );

    const txMap = {};
    txRows.forEach(r => {
      txMap[r.action_type] = Number(r.earned_today);
    });

    const todayCaps = {};
    ruleRows.forEach(rule => {
      const earned = txMap[rule.action_type] || 0;
      todayCaps[rule.action_type] = {
        earned,
        cap: rule.daily_cap_points,
        remaining: Math.max(0, rule.daily_cap_points - earned)
      };
    });

    res.json({
      user,
      rank: user.rank,
      badges: badgeRows,
      ownedOrgs: orgRows,
      todayCaps
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/me (Update the current user's name and profile photo)
router.patch('/me', authMiddleware, async (req, res, next) => {
  try {
    const updates = [];
    const values = [];

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim() || req.body.name.trim().length > 100) {
        return res.status(400).json({ error: 'Nama wajib diisi dan maksimal 100 karakter.' });
      }
      updates.push('name = ?');
      values.push(req.body.name.trim());
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'avatar_data')) {
      const avatarData = req.body.avatar_data;
      if (avatarData !== null && (
        typeof avatarData !== 'string'
        || avatarData.length > 700000
        || !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(avatarData)
      )) {
        return res.status(400).json({ error: 'Foto profil tidak valid atau ukurannya terlalu besar.' });
      }
      updates.push('avatar_data = ?');
      values.push(avatarData);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Tidak ada perubahan profil yang dikirim.' });
    }

    values.push(req.user.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query(
      'SELECT id, name, email, role, faculty, major, avatar_data FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: rows[0], message: 'Profil berhasil diperbarui.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id (Public profile)
router.get('/users/:id', authMiddleware, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.role, u.faculty, u.major, u.bio, u.avatar_data, u.total_points, u.created_at,
              (SELECT COUNT(*) FROM study_group_membership_history mh WHERE mh.user_id = u.id) AS groups_joined_count,
              COALESCE(l.rank_no, 0) AS \`rank\`
       FROM users u
       LEFT JOIN leaderboard l ON l.user_id = u.id
       WHERE u.id = ?`,
      [targetId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const publicUser = rows[0];

    const [badgeRows] = await pool.query(
      `SELECT b.id, b.name, b.subject, b.description, ub.approved_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = ? AND ub.status = 'approved'`,
      [targetId]
    );

    res.json({
      user: publicUser,
      badges: badgeRows
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
