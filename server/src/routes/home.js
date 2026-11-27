const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { getLiveLocations } = require('../services/headcount');

const router = express.Router();

// GET /api/home (Auth)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin Home payload
    if (userRole === 'admin') {
      const [[orgPending]] = await pool.query("SELECT COUNT(*) as count FROM organizations WHERE status = 'pending'");
      const [[badgePending]] = await pool.query("SELECT COUNT(*) as count FROM user_badges WHERE status = 'pending'");

      const [[totalUsers]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
      const [[totalGroups]] = await pool.query("SELECT COUNT(*) as count FROM study_groups WHERE status != 'closed'");
      const [[totalEvents]] = await pool.query("SELECT COUNT(*) as count FROM events WHERE status = 'published'");
      const [[totalPlaces]] = await pool.query("SELECT COUNT(*) as count FROM locations WHERE is_active = TRUE");
      const [[totalOrgs]] = await pool.query("SELECT COUNT(*) as count FROM organizations");

      return res.json({
        pending: {
          orgs: orgPending.count,
          badges: badgePending.count
        },
        totals: {
          users: totalUsers.count,
          groups: totalGroups.count,
          events: totalEvents.count,
          places: totalPlaces.count,
          organizations: totalOrgs.count
        }
      });
    }

    // Student / Org Owner payload
    // 1. Current user details & rank
    const [userRows] = await pool.query(
      `SELECT u.id, u.name, u.total_points, COALESCE(l.rank_no, 0) AS \`rank\`
       FROM users u
       LEFT JOIN leaderboard l ON l.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );
    const user = userRows[0] || { id: userId, name: '', total_points: 0, rank: 0 };

    // Badge progress (Database Systems badge as per Section 8.2 & 11)
    const [badgeAnswers] = await pool.query(
      `SELECT COUNT(*) as answers
       FROM group_posts p
       JOIN study_groups g ON g.id = p.group_id
       WHERE p.user_id = ? AND p.type = 'answer' AND g.subject = 'Database Systems'`,
      [userId]
    );
    const badgeProgress = {
      subject: 'Database Systems',
      answers: badgeAnswers[0].answers || 0,
      needed: 5
    };

    // 2. Summary stats & Busiest places
    const liveLocations = await getLiveLocations(userId);
    const totalPeople = liveLocations.reduce((sum, loc) => sum + loc.active_people, 0);
    const activePlacesCount = liveLocations.filter(loc => loc.active_people > 0).length;

    const busiestPlaces = [...liveLocations]
      .sort((a, b) => b.active_people - a.active_people)
      .slice(0, 3)
      .map(loc => ({
        id: loc.id,
        name: loc.name,
        short_description: loc.short_description || loc.name,
        active_people: loc.active_people
      }));

    // 3. Recommended groups (up to 3 upcoming joinable groups)
    const [groups] = await pool.query(
      `SELECT g.id, g.title, g.subject, g.scheduled_at, g.max_members,
              l.name AS location_name,
              COUNT(m.user_id) AS members,
              MAX(CASE WHEN m.user_id = ? THEN 1 ELSE 0 END) AS is_joined
       FROM study_groups g
       JOIN locations l ON l.id = g.location_id
       LEFT JOIN study_group_members m ON m.group_id = g.id
       WHERE g.status IN ('open', 'full') AND g.scheduled_at >= NOW()
       GROUP BY g.id
       ORDER BY g.scheduled_at ASC
       LIMIT 3`,
      [userId]
    );

    const recommendedGroups = groups.map(g => ({
      id: g.id,
      title: g.title,
      subject: g.subject,
      scheduled_at: g.scheduled_at,
      members: Number(g.members),
      max_members: g.max_members,
      location_name: g.location_name,
      is_joined: Boolean(g.is_joined)
    }));

    // 4. Upcoming events (next 3)
    const [events] = await pool.query(
      `SELECT e.id, e.title, e.start_at, o.name AS org_name,
              ea.status AS myStatus
       FROM events e
       JOIN organizations o ON o.id = e.organization_id
       LEFT JOIN event_applications ea ON ea.event_id = e.id AND ea.user_id = ?
       WHERE e.status = 'published' AND e.start_at >= NOW()
       ORDER BY e.start_at ASC
       LIMIT 3`,
      [userId]
    );

    // 5. My communities (joined communities with latest message preview)
    const [communities] = await pool.query(
      `SELECT c.id, c.name,
              m.content AS last_content,
              u.name AS last_author,
              m.created_at AS last_time
       FROM communities c
       JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = ?
       LEFT JOIN community_messages m ON m.id = (
         SELECT id FROM community_messages
         WHERE community_id = c.id
         ORDER BY created_at DESC, id DESC
         LIMIT 1
       )
       LEFT JOIN users u ON u.id = m.user_id
       ORDER BY m.created_at DESC
       LIMIT 5`,
      [userId]
    );

    const myCommunities = communities.map(c => ({
      id: c.id,
      name: c.name,
      lastMessage: c.last_content ? {
        author: c.last_author || 'User',
        content: c.last_content
      } : null
    }));

    // 6. Top 3 Leaderboard this week
    const [top3] = await pool.query(
      `SELECT name, faculty, total_points
       FROM users
       WHERE role = 'student'
       ORDER BY total_points DESC
       LIMIT 3`
    );

    // 7. Organizations owned by the user
    const [orgs] = await pool.query(
      `SELECT o.id, o.name, o.status,
              (SELECT COUNT(*) FROM events e WHERE e.organization_id = o.id AND e.status = 'published') AS publishedEvents,
              (SELECT COUNT(*) FROM event_applications ea JOIN events e ON e.id = ea.event_id WHERE e.organization_id = o.id AND ea.status = 'pending') AS pendingApplicants,
              (SELECT COUNT(*) FROM collaboration_requests cr WHERE cr.to_org_id = o.id AND cr.status = 'pending') AS pendingCollab
       FROM organizations o
       WHERE o.owner_id = ?`,
      [userId]
    );

    res.json({
      me: {
        name: user.name,
        points: user.total_points,
        rank: user.rank,
        badgeProgress
      },
      summary: {
        peopleStudying: totalPeople,
        placesActive: activePlacesCount
      },
      busiestPlaces,
      recommendedGroups,
      upcomingEvents: events.map(e => ({
        id: e.id,
        title: e.title,
        org_name: e.org_name,
        start_at: e.start_at,
        myStatus: e.myStatus || null
      })),
      myCommunities,
      top3,
      orgs: orgs.map(o => ({
        id: o.id,
        name: o.name,
        status: o.status,
        publishedEvents: Number(o.publishedEvents),
        pendingApplicants: Number(o.pendingApplicants),
        pendingCollab: Number(o.pendingCollab)
      }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
