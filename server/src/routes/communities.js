const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { awardPoints } = require('../services/points');
const { getReply } = require('../services/chatbot');

const router = express.Router();

// GET /api/communities (Browse communities with memberCount and isMember)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT c.id, c.organization_id, c.name, c.description, c.category, c.created_at,
             o.name AS org_name, o.status AS org_status,
             COUNT(cm.user_id) AS member_count,
             MAX(CASE WHEN cm.user_id = ? THEN 1 ELSE 0 END) AS is_member
      FROM communities c
      LEFT JOIN organizations o ON o.id = c.organization_id
      LEFT JOIN community_members cm ON cm.community_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
      LIMIT 50
    `;

    const [rows] = await pool.query(query, [userId]);
    res.json(rows.map(r => ({
      ...r,
      member_count: Number(r.member_count),
      is_member: Boolean(r.is_member)
    })));
  } catch (err) {
    next(err);
  }
});

// POST /api/communities (Create community)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Admins cannot create communities.' });
    }
    const userId = req.user.id;
    const { name, description, category, organization_id } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Community name is required.' });
    }

    // If linking to organization, verify that user owns it and it's verified
    if (organization_id) {
      const [orgRows] = await pool.query(
        'SELECT owner_id, status FROM organizations WHERE id = ?',
        [organization_id]
      );
      if (orgRows.length === 0) {
        return res.status(404).json({ error: 'Organization not found.' });
      }
      if (orgRows[0].owner_id !== userId) {
        return res.status(403).json({ error: 'Only the organization owner can link a community to it.' });
      }
      if (orgRows[0].status !== 'verified') {
        return res.status(403).json({ error: 'Organization must be verified before creating an official community.' });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO communities (organization_id, created_by, bot_user_id, name, description, category)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        organization_id || null,
        userId,
        userId, // default persona user
        name.trim(),
        description ? description.trim() : null,
        category ? category.trim() : 'General'
      ]
    );

    const communityId = result.insertId;

    // Creator joins as admin member
    await pool.query(
      `INSERT INTO community_members (community_id, user_id, role)
       VALUES (?, ?, 'admin')`,
      [communityId, userId]
    );

    res.status(201).json({ id: communityId, message: 'Community created successfully.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/communities/:id/join (Join community)
router.post('/:id/join', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Admins cannot join communities.' });
    }
    const communityId = req.params.id;
    const userId = req.user.id;

    // Check existing
    const [existing] = await pool.query(
      'SELECT community_id FROM community_members WHERE community_id = ? AND user_id = ?',
      [communityId, userId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'You are already a member of this community.' });
    }

    await pool.query(
      `INSERT INTO community_members (community_id, user_id, role)
       VALUES (?, ?, 'member')`,
      [communityId, userId]
    );

    res.status(201).json({ message: 'Successfully joined community!' });
  } catch (err) {
    next(err);
  }
});

// GET /api/communities/:id/messages (Members only - load last messages oldest first)
router.get('/:id/messages', authMiddleware, async (req, res, next) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.id;
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);

    // Verify membership
    const [memRows] = await pool.query(
      'SELECT role FROM community_members WHERE community_id = ? AND user_id = ?',
      [communityId, userId]
    );
    if (memRows.length === 0) {
      return res.status(403).json({ error: 'Only community members can view messages.' });
    }

    const [communityRows] = await pool.query(
      `SELECT c.id, c.name, c.description, c.bot_user_id,
              o.name AS org_name, o.status AS org_status
       FROM communities c
       LEFT JOIN organizations o ON o.id = c.organization_id
       WHERE c.id = ?`,
      [communityId]
    );

    const [msgRows] = await pool.query(
      `SELECT m.id, m.community_id, m.user_id, m.content, m.is_broadcast, m.is_auto_reply, m.created_at,
              u.name AS author_name, u.role AS author_role
       FROM community_messages m
       JOIN users u ON u.id = m.user_id
       WHERE m.community_id = ?
       ORDER BY m.created_at ASC, m.id ASC
       LIMIT ?`,
      [communityId, limit]
    );

    res.json({
      community: communityRows[0],
      myRole: memRows[0].role,
      messages: msgRows
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/communities/:id/messages (Send message & trigger rule-based reply)
router.post('/:id/messages', authMiddleware, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const communityId = req.params.id;
    const userId = req.user.id;
    const { content, isBroadcast = false } = req.body;

    // 1. Verify membership
    const [memRows] = await conn.query(
      'SELECT role FROM community_members WHERE community_id = ? AND user_id = ?',
      [communityId, userId]
    );
    if (memRows.length === 0) {
      await conn.rollback();
      return res.status(403).json({ error: 'Only community members can send messages.' });
    }

    const memberRole = memRows[0].role;

    if (!content || !content.trim()) {
      await conn.rollback();
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    const trimmedContent = content.trim().slice(0, 500);

    // If broadcast, require admin role
    if (isBroadcast && memberRole !== 'admin') {
      await conn.rollback();
      return res.status(403).json({ error: 'Only community admins can send broadcast announcements.' });
    }

    // 2. Fetch community & persona bot details
    const [commRows] = await conn.query(
      'SELECT id, name, organization_id, created_by, bot_user_id FROM communities WHERE id = ?',
      [communityId]
    );
    if (commRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Community not found.' });
    }
    const community = commRows[0];

    // Fetch user info for chatbot context
    const [[currentUser]] = await conn.query('SELECT id, name, role FROM users WHERE id = ?', [userId]);

    // 3. Insert user message
    const [userMsgResult] = await conn.query(
      `INSERT INTO community_messages (community_id, user_id, content, is_broadcast, is_auto_reply)
       VALUES (?, ?, ?, ?, FALSE)`,
      [communityId, userId, trimmedContent, Boolean(isBroadcast)]
    );

    const userMsg = {
      id: userMsgResult.insertId,
      community_id: parseInt(communityId, 10),
      user_id: userId,
      author_name: currentUser.name,
      content: trimmedContent,
      is_broadcast: Boolean(isBroadcast),
      is_auto_reply: false,
      created_at: new Date()
    };

    // 4. Award send_message points (+1 pt, daily cap 10) - FR-COM-6
    const pointsResult = await awardPoints(conn, userId, 'send_message');

    // 5. If broadcast: no auto-reply
    if (isBroadcast) {
      await conn.commit();
      return res.status(201).json({
        message: userMsg,
        reply: null,
        points: pointsResult
      });
    }

    // 6. Generate auto-reply using rule-based engine (Appendix B)
    const replyText = await getReply(trimmedContent, {
      user: currentUser,
      community,
      db: conn
    });

    let botMsg = null;
    if (replyText) {
      const botUserId = community.bot_user_id || community.created_by || userId;
      const [[botUser]] = await conn.query('SELECT name FROM users WHERE id = ?', [botUserId]);

      const [botMsgResult] = await conn.query(
        `INSERT INTO community_messages (community_id, user_id, content, is_broadcast, is_auto_reply, created_at)
         VALUES (?, ?, ?, FALSE, TRUE, DATE_ADD(NOW(), INTERVAL 1 SECOND))`,
        [communityId, botUserId, replyText]
      );

      botMsg = {
        id: botMsgResult.insertId,
        community_id: parseInt(communityId, 10),
        user_id: botUserId,
        author_name: botUser ? botUser.name : 'Community Assistant',
        content: replyText,
        is_broadcast: false,
        is_auto_reply: true,
        created_at: new Date(Date.now() + 1000)
      };
    }

    await conn.commit();

    res.status(201).json({
      message: userMsg,
      reply: botMsg,
      points: pointsResult
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
