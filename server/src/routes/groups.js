const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { awardPoints } = require('../services/points');
const { checkBadgeEligibility } = require('../services/badges');

const router = express.Router();

// GET /api/groups (Browse/filter groups)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subject, location } = req.query;

    let query = `
      SELECT g.id, g.creator_id, g.title, g.subject, g.description,
             g.location_id, g.scheduled_at, g.max_members, g.status, g.created_at,
             l.name AS location_name, l.address AS location_address,
             u.name AS creator_name,
             COUNT(m.user_id) AS member_count,
             MAX(CASE WHEN m.user_id = ? THEN 1 ELSE 0 END) AS is_member
      FROM study_groups g
      JOIN locations l ON l.id = g.location_id
      JOIN users u ON u.id = g.creator_id
      LEFT JOIN study_group_members m ON m.group_id = g.id
      WHERE g.status IN ('open', 'full')
        AND g.scheduled_at >= NOW()
    `;

    const params = [userId];

    if (subject) {
      query += ' AND g.subject = ?';
      params.push(subject);
    }
    if (location) {
      query += ' AND g.location_id = ?';
      params.push(location);
    }

    query += ' GROUP BY g.id ORDER BY g.scheduled_at ASC LIMIT 50';

    const [rows] = await pool.query(query, params);

    res.json(rows.map(r => ({
      ...r,
      member_count: Number(r.member_count),
      is_member: Boolean(r.is_member)
    })));
  } catch (err) {
    next(err);
  }
});

// POST /api/groups (Create study group)
router.post('/', authMiddleware, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    if (req.user.role !== 'student') {
      await conn.rollback();
      return res.status(403).json({ error: 'Only students can create study groups.' });
    }
    await conn.beginTransaction();
    const creatorId = req.user.id;
    const { title, subject, description, location_id, scheduled_at, max_members = 8 } = req.body;

    if (!title || !subject || !location_id || !scheduled_at) {
      await conn.rollback();
      return res.status(400).json({ error: 'Title, subject, location, and scheduled time are required.' });
    }

    const membersLimit = Math.max(2, Math.min(20, parseInt(max_members, 10) || 8));

    const [result] = await conn.query(
      `INSERT INTO study_groups (creator_id, title, subject, description, location_id, scheduled_at, max_members, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
      [creatorId, title.trim(), subject.trim(), description ? description.trim() : null, location_id, scheduled_at, membersLimit]
    );

    const groupId = result.insertId;

    // Creator auto-joins
    await conn.query(
      'INSERT INTO study_group_members (group_id, user_id) VALUES (?, ?)',
      [groupId, creatorId]
    );

    await conn.commit();
    res.status(201).json({ id: groupId, message: 'Study group created successfully.' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// GET /api/groups/:id (Group detail with members and approved badges)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;

    const [groupRows] = await pool.query(
      `SELECT g.id, g.creator_id, g.title, g.subject, g.description,
              g.location_id, g.scheduled_at, g.max_members, g.status, g.created_at,
              l.name AS location_name, l.address AS location_address,
              CAST(l.latitude AS DOUBLE) AS latitude,
              CAST(l.longitude AS DOUBLE) AS longitude,
              u.name AS creator_name
       FROM study_groups g
       JOIN locations l ON l.id = g.location_id
       JOIN users u ON u.id = g.creator_id
       WHERE g.id = ?`,
      [groupId]
    );

    if (groupRows.length === 0) {
      return res.status(404).json({ error: 'Study group not found.' });
    }

    const group = groupRows[0];

    // Fetch members + badge icons
    const [memberRows] = await pool.query(
      `SELECT m.user_id, m.joined_at, m.checked_in_at, u.name, u.faculty, u.major,
              GROUP_CONCAT(b.name SEPARATOR ', ') AS badges
       FROM study_group_members m
       JOIN users u ON u.id = m.user_id
       LEFT JOIN user_badges ub ON ub.user_id = u.id AND ub.status = 'approved'
       LEFT JOIN badges b ON b.id = ub.badge_id
       WHERE m.group_id = ?
       GROUP BY m.user_id`,
      [groupId]
    );

    const isMember = memberRows.some(m => m.user_id === userId);

    res.json({
      group,
      members: memberRows,
      isMember,
      isCreator: group.creator_id === userId
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/groups/:id/ticket (A member retrieves their Open Party attendance QR)
router.get('/:id/ticket', authMiddleware, async (req, res, next) => {
  let conn;
  let transactionStarted = false;
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Hanya mahasiswa yang dapat mengambil QR kehadiran.' });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();
    transactionStarted = true;
    const [members] = await conn.query(
      `SELECT ticket_code FROM study_group_members
       WHERE group_id = ? AND user_id = ? FOR UPDATE`,
      [req.params.id, req.user.id]
    );
    if (members.length === 0) {
      await conn.rollback();
      transactionStarted = false;
      return res.status(403).json({ error: 'Gabung ke Open Party sebelum mengambil QR kehadiran.' });
    }

    const ticketCode = members[0].ticket_code || crypto.randomBytes(32).toString('hex');
    if (!members[0].ticket_code) {
      await conn.query(
        'UPDATE study_group_members SET ticket_code = ? WHERE group_id = ? AND user_id = ?',
        [ticketCode, req.params.id, req.user.id]
      );
    }
    await conn.commit();
    transactionStarted = false;
    res.json({ ticketCode });
  } catch (err) {
    if (conn && transactionStarted) await conn.rollback();
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/groups/:id/check-ins (Only the group creator can verify member QR tickets)
router.post('/:id/check-ins', authMiddleware, async (req, res, next) => {
  let conn;
  let transactionStarted = false;
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Hanya penyelenggara Open Party yang dapat memvalidasi QR.' });
    }
    const ticketCode = typeof req.body.ticket_code === 'string'
      ? req.body.ticket_code.trim()
      : '';
    if (!/^[a-f0-9]{64}$/i.test(ticketCode)) {
      return res.status(400).json({ error: 'Kode QR kehadiran tidak valid.' });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();
    transactionStarted = true;
    const [members] = await conn.query(
      `SELECT gm.user_id, gm.checked_in_at, u.name, u.faculty, u.major,
              g.creator_id, g.title AS group_title
       FROM study_group_members gm
       JOIN users u ON u.id = gm.user_id
       JOIN study_groups g ON g.id = gm.group_id
       WHERE gm.group_id = ? AND gm.ticket_code = ?
       FOR UPDATE`,
      [req.params.id, ticketCode]
    );
    if (members.length === 0) {
      await conn.rollback();
      transactionStarted = false;
      return res.status(404).json({ error: 'QR tidak ditemukan untuk Open Party ini.' });
    }

    const member = members[0];
    if (member.creator_id !== req.user.id) {
      await conn.rollback();
      transactionStarted = false;
      return res.status(403).json({ error: 'Hanya penyelenggara Open Party yang dapat melakukan verifikasi.' });
    }
    if (member.checked_in_at) {
      await conn.rollback();
      transactionStarted = false;
      return res.status(409).json({
        error: 'Mahasiswa ini sudah tercatat hadir.',
        attendee: { name: member.name, checked_in_at: member.checked_in_at }
      });
    }

    await conn.query(
      `UPDATE study_group_members
       SET checked_in_at = NOW(), checked_in_by = ?
       WHERE group_id = ? AND user_id = ?`,
      [req.user.id, req.params.id, member.user_id]
    );
    const [[checkedIn]] = await conn.query(
      'SELECT checked_in_at FROM study_group_members WHERE group_id = ? AND user_id = ?',
      [req.params.id, member.user_id]
    );
    await conn.commit();
    transactionStarted = false;
    res.json({
      message: 'Kehadiran berhasil diverifikasi.',
      attendee: {
        name: member.name,
        faculty: member.faculty,
        major: member.major,
        group_title: member.group_title,
        checked_in_at: checkedIn.checked_in_at
      }
    });
  } catch (err) {
    if (conn && transactionStarted) await conn.rollback();
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/groups/:id/join (Transaction with row-level lock)
router.post('/:id/join', authMiddleware, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    if (req.user.role !== 'student') {
      await conn.rollback();
      return res.status(403).json({ error: 'Only students can join study groups.' });
    }
    await conn.beginTransaction();
    const groupId = req.params.id;
    const userId = req.user.id;

    // 1. Lock group row
    const [groupRows] = await conn.query(
      'SELECT id, max_members, status FROM study_groups WHERE id = ? FOR UPDATE',
      [groupId]
    );

    if (groupRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Study group not found.' });
    }

    const group = groupRows[0];

    if (group.status === 'closed') {
      await conn.rollback();
      return res.status(409).json({ error: 'This study group is closed.' });
    }

    // 2. Check if already member
    const [memRows] = await conn.query(
      'SELECT user_id FROM study_group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    if (memRows.length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'You are already a member of this study group.' });
    }

    // 3. Check current member count
    const [[countRow]] = await conn.query(
      'SELECT COUNT(*) AS count FROM study_group_members WHERE group_id = ?',
      [groupId]
    );
    const currentMembers = countRow.count;

    if (currentMembers >= group.max_members) {
      await conn.rollback();
      return res.status(409).json({ error: 'Study group is full.' });
    }

    // 4. Insert membership
    await conn.query(
      'INSERT INTO study_group_members (group_id, user_id) VALUES (?, ?)',
      [groupId, userId]
    );

    // 5. If full, update status
    if (currentMembers + 1 >= group.max_members) {
      await conn.query("UPDATE study_groups SET status = 'full' WHERE id = ?", [groupId]);
    }

    // 6. Award join points (FR-PTS-1)
    const pointsResult = await awardPoints(conn, userId, 'join_group', { groupId });

    await conn.commit();
    res.status(201).json({
      message: 'Successfully joined study group!',
      points: pointsResult
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// DELETE /api/groups/:id/join (Leave group - P1)
router.delete('/:id/join', authMiddleware, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const groupId = req.params.id;
    const userId = req.user.id;

    const [groupRows] = await conn.query(
      'SELECT id, creator_id, status FROM study_groups WHERE id = ? FOR UPDATE',
      [groupId]
    );
    if (groupRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Group not found' });
    }

    if (groupRows[0].creator_id === userId) {
      await conn.rollback();
      return res.status(400).json({ error: 'Group creator cannot leave. You may close the group instead.' });
    }

    const [deleteResult] = await conn.query(
      'DELETE FROM study_group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    if (deleteResult.affectedRows === 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'You are not a member of this group.' });
    }

    // Revert status to open only when the remaining count is below the limit
    if (groupRows[0].status === 'full') {
      const [[countRow]] = await conn.query(
        'SELECT COUNT(*) AS count FROM study_group_members WHERE group_id = ?',
        [groupId]
      );
      const [[groupLimit]] = await conn.query(
        'SELECT max_members FROM study_groups WHERE id = ?',
        [groupId]
      );
      if (countRow.count < groupLimit.max_members) {
        await conn.query("UPDATE study_groups SET status = 'open' WHERE id = ?", [groupId]);
      }
    }

    await conn.commit();
    res.json({ message: 'Successfully left the group.' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// PATCH /api/groups/:id (Creator close group - P1)
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;
    const { status } = req.body;

    const [rows] = await pool.query('SELECT creator_id FROM study_groups WHERE id = ?', [groupId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    if (rows[0].creator_id !== userId) {
      return res.status(403).json({ error: 'Only creator can modify group status.' });
    }

    if (status === 'closed') {
      await pool.query("UPDATE study_groups SET status = 'closed' WHERE id = ?", [groupId]);
      return res.json({ message: 'Group closed successfully.' });
    }

    res.status(400).json({ error: 'Invalid status' });
  } catch (err) {
    next(err);
  }
});

// GET /api/groups/:id/posts (Questions with nested answers)
router.get('/:id/posts', authMiddleware, async (req, res, next) => {
  try {
    const groupId = req.params.id;

    const [rows] = await pool.query(
      `SELECT p.id, p.group_id, p.user_id, p.parent_id, p.type, p.content, p.created_at,
              u.name AS author_name, u.faculty,
              GROUP_CONCAT(b.name SEPARATOR ', ') AS author_badges
       FROM group_posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN user_badges ub ON ub.user_id = u.id AND ub.status = 'approved'
       LEFT JOIN badges b ON b.id = ub.badge_id
       WHERE p.group_id = ?
       GROUP BY p.id
       ORDER BY p.created_at ASC`,
      [groupId]
    );

    // Structure questions with nested answers
    const postMap = new Map();
    const rootPosts = [];

    rows.forEach(post => {
      post.answers = [];
      postMap.set(post.id, post);
    });

    rows.forEach(post => {
      if (post.parent_id && postMap.has(post.parent_id)) {
        postMap.get(post.parent_id).answers.push(post);
      } else if (!post.parent_id) {
        rootPosts.push(post);
      }
    });

    res.json(rootPosts);
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:id/posts (Post question/answer/note - member only)
router.post('/:id/posts', authMiddleware, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const groupId = req.params.id;
    const userId = req.user.id;
    const { type = 'note', content, parent_id = null } = req.body;

    if (!content || !content.trim()) {
      await conn.rollback();
      return res.status(400).json({ error: 'Content cannot be empty.' });
    }

    // 1. Verify membership
    const [memRows] = await conn.query(
      'SELECT user_id FROM study_group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    if (memRows.length === 0) {
      await conn.rollback();
      return res.status(403).json({ error: 'Only group members can post.' });
    }

    // 2. Fetch group subject for badge tracking
    const [[group]] = await conn.query('SELECT subject FROM study_groups WHERE id = ?', [groupId]);

    // 3. If answer, validate parent question
    let parentQuestion = null;
    if (type === 'answer') {
      if (!parent_id) {
        await conn.rollback();
        return res.status(400).json({ error: 'Answers must reference a parent question.' });
      }
      const [pRows] = await conn.query(
        'SELECT id, user_id, group_id, type FROM group_posts WHERE id = ?',
        [parent_id]
      );
      if (
        pRows.length === 0 ||
        pRows[0].group_id !== parseInt(groupId, 10) ||
        pRows[0].type !== 'question'
      ) {
        await conn.rollback();
        return res.status(400).json({ error: 'Parent question not found in this group.' });
      }
      parentQuestion = pRows[0];
    }

    // 4. Insert post
    const [result] = await conn.query(
      `INSERT INTO group_posts (group_id, user_id, parent_id, type, content)
       VALUES (?, ?, ?, ?, ?)`,
      [groupId, userId, parent_id || null, type, content.trim()]
    );

    const newPostId = result.insertId;

    // 5. Points calculation for answer (Anti-abuse checks: length >= 10, not own question)
    let pointsResult = { awarded: 0 };
    let badgeResult = { badgeRequested: false };

    if (type === 'answer') {
      const isLongEnough = content.trim().length >= 10;
      const isNotOwn = parentQuestion && parentQuestion.user_id !== userId;

      if (isLongEnough && isNotOwn) {
        pointsResult = await awardPoints(conn, userId, 'answer_post', { groupId });
      }

      // Check badge eligibility (Section 8.2)
      badgeResult = await checkBadgeEligibility(conn, userId, group.subject);
    }

    await conn.commit();

    res.status(201).json({
      post: {
        id: newPostId,
        group_id: groupId,
        user_id: userId,
        parent_id,
        type,
        content: content.trim()
      },
      points: pointsResult,
      badgeRequested: badgeResult.badgeRequested,
      badgeName: badgeResult.badgeName || null
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
