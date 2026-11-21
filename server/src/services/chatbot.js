/**
 * Rule-based chat responder as specified in PRD Section 5.7 and Appendix B.
 * Fully deterministic logic with context-aware data lookups in English & Indonesian.
 */

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsWord(normText, keyword) {
  // Regex word boundary match for short keywords like 'hi', 'hey', 'ada'
  const regex = new RegExp(`(^|\\s)${keyword}(\\s|$)`, 'i');
  return regex.test(normText);
}

function formatDate(date, lang) {
  const d = new Date(date);
  const options = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  };
  const str = d.toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', options);
  return lang === 'id' ? str.replace(':', '.') : str;
}

const INDONESIAN_INDICATORS = ['yang', 'aku', 'saya', 'gimana', 'apa', 'ada', 'kapan', 'siapa', 'kenapa', 'di mana', 'dimana', 'dong', 'ya', 'kah'];

function detectFallbackLanguage(text) {
  const norm = normalizeText(text);
  const words = norm.split(' ');
  const hasIdWord = words.some(w => INDONESIAN_INDICATORS.includes(w));
  return hasIdWord ? 'id' : 'en';
}

const RULES = [
  // 1. Greeting
  {
    id: 'greeting',
    en: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
    id_kw: ['halo', 'hai', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam', 'assalamualaikum'],
    async handler(ctx, lang) {
      if (lang === 'id') {
        return `Halo ${ctx.firstName}! Selamat datang di ${ctx.communityName}. Tanya soal event, grup belajar, tempat, atau poin ya.`;
      }
      return `Hi ${ctx.firstName}! Welcome to ${ctx.communityName}. Ask me about events, study groups, places, or points.`;
    }
  },

  // 2. Thanks
  {
    id: 'thanks',
    en: ['thanks', 'thank you', 'thx'],
    id_kw: ['makasih', 'terima kasih', 'makasi', 'tengkyu'],
    async handler(ctx, lang) {
      return lang === 'id' ? 'Sama-sama!' : "You're welcome!";
    }
  },

  // 3. Bye
  {
    id: 'bye',
    en: ['bye', 'see you', 'goodbye'],
    id_kw: ['dadah', 'sampai jumpa', 'duluan', 'bye'],
    async handler(ctx, lang) {
      return lang === 'id' ? `Sampai jumpa, ${ctx.firstName}!` : `See you around, ${ctx.firstName}!`;
    }
  },

  // 4. Help
  {
    id: 'help',
    en: ['help', 'what can you do'],
    id_kw: ['bantuan', 'bisa apa', 'tolong'],
    async handler(ctx, lang) {
      if (lang === 'id') {
        return 'Aku bisa kasih info event terdekat, grup belajar, tempat ramai, poin dan peringkatmu, badge, dan organisasi.';
      }
      return 'I can tell you about upcoming events, study groups, busy places, your points and rank, badges, and organizations.';
    }
  },

  // 5. Subject group (Database, Calculus, Thermodynamics, Data Structures, etc.)
  {
    id: 'subject_group',
    en: ['database', 'calculus', 'thermodynamics', 'data structure', 'data structures', 'linear algebra', 'software engineering'],
    id_kw: ['kalkulus', 'termodinamika', 'struktur data', 'aljabar linear', 'rekayasa perangkat lunak'],
    async handler(ctx, lang, matchedKeyword) {
      // Find subject name based on keyword
      let subjectPattern = matchedKeyword;
      if (matchedKeyword.includes('kalkulus') || matchedKeyword.includes('calculus')) subjectPattern = 'Calculus';
      else if (matchedKeyword.includes('database')) subjectPattern = 'Database Systems';
      else if (matchedKeyword.includes('termo')) subjectPattern = 'Thermodynamics';
      else if (matchedKeyword.includes('struktur') || matchedKeyword.includes('structure')) subjectPattern = 'Data Structures';
      else if (matchedKeyword.includes('aljabar') || matchedKeyword.includes('algebra')) subjectPattern = 'Linear Algebra';

      const [rows] = await ctx.db.query(
        `SELECT g.id, g.title, g.subject, g.scheduled_at, g.max_members,
                l.name AS place,
                COUNT(m.user_id) AS members
         FROM study_groups g
         JOIN locations l ON l.id = g.location_id
         LEFT JOIN study_group_members m ON m.group_id = g.id
         WHERE g.status = 'open' AND g.subject LIKE ? AND g.scheduled_at >= NOW()
         GROUP BY g.id
         HAVING members < g.max_members
         ORDER BY g.scheduled_at ASC
         LIMIT 1`,
        [`%${subjectPattern}%`]
      );

      if (rows.length > 0) {
        const g = rows[0];
        const timeStr = formatDate(g.scheduled_at, lang);
        if (lang === 'id') {
          return `Coba grup '${g.title}' (${g.subject}) di ${g.place}, ${timeStr}, terisi ${g.members}/${g.max_members}. Buka tab Open Party lalu klik Join!`;
        }
        return `Try '${g.title}' (${g.subject}) at ${g.place}, ${timeStr}, ${g.members}/${g.max_members} joined. Open the Open Party tab and press Join!`;
      }

      if (lang === 'id') {
        return `Belum ada grup ${subjectPattern} yang terbuka. Kamu bisa buat sendiri di Open Party.`;
      }
      return `No open ${subjectPattern} group right now. You can create one in Open Party.`;
    }
  },

  // 6. Study group (Generic)
  {
    id: 'study_group',
    en: ['study group', 'study partner', 'study with', 'group'],
    id_kw: ['grup belajar', 'teman belajar', 'belajar bareng', 'kelompok belajar', 'grup'],
    async handler(ctx, lang) {
      const [rows] = await ctx.db.query(
        `SELECT g.id, g.title, g.subject, g.scheduled_at, g.max_members,
                l.name AS place,
                COUNT(m.user_id) AS members
         FROM study_groups g
         JOIN locations l ON l.id = g.location_id
         LEFT JOIN study_group_members m ON m.group_id = g.id
         WHERE g.status = 'open' AND g.scheduled_at >= NOW()
         GROUP BY g.id
         HAVING members < g.max_members
         ORDER BY g.scheduled_at ASC
         LIMIT 1`
      );

      if (rows.length > 0) {
        const g = rows[0];
        const timeStr = formatDate(g.scheduled_at, lang);
        if (lang === 'id') {
          return `Coba grup '${g.title}' (${g.subject}) di ${g.place}, ${timeStr}, terisi ${g.members}/${g.max_members}. Buka tab Open Party lalu klik Join!`;
        }
        return `Try '${g.title}' (${g.subject}) at ${g.place}, ${timeStr}, ${g.members}/${g.max_members} joined. Open the Open Party tab and press Join!`;
      }

      if (lang === 'id') {
        return 'Belum ada grup belajar yang terbuka saat ini. Kamu bisa buat sendiri di Open Party!';
      }
      return 'No open study groups right now. You can create one in Open Party!';
    }
  },

  // 7. Events
  {
    id: 'events',
    en: ['event', 'events', 'workshop', 'seminar', 'upcoming'],
    id_kw: ['acara', 'kegiatan', 'event', 'workshop', 'seminar'],
    async handler(ctx, lang) {
      // Prefer event from this community's organization if available
      let query = `
        SELECT e.title, e.start_at, o.name AS org, l.name AS place
        FROM events e
        JOIN organizations o ON o.id = e.organization_id
        LEFT JOIN locations l ON l.id = e.location_id
        WHERE e.status = 'published' AND e.start_at >= NOW()
      `;
      const params = [];

      if (ctx.communityOrgId) {
        query += ' ORDER BY (e.organization_id = ?) DESC, e.start_at ASC LIMIT 1';
        params.push(ctx.communityOrgId);
      } else {
        query += ' ORDER BY e.start_at ASC LIMIT 1';
      }

      const [rows] = await ctx.db.query(query, params);

      if (rows.length > 0) {
        const e = rows[0];
        const dateStr = formatDate(e.start_at, lang);
        const placeStr = e.place || (lang === 'id' ? 'Area Kampus' : 'Campus Venue');
        if (lang === 'id') {
          return `Event terdekat: ${e.title} oleh ${e.org}, ${dateStr} di ${placeStr}. Buka tab Events untuk daftar!`;
        }
        return `Next event: ${e.title} by ${e.org} on ${dateStr} at ${placeStr}. Open the Events tab to apply!`;
      }

      return lang === 'id' ? 'Belum ada event mendatang.' : 'No upcoming events yet.';
    }
  },

  // 8. Places
  {
    id: 'places',
    en: ['place', 'where to study', 'location', 'library', 'cafe'],
    id_kw: ['tempat', 'lokasi', 'perpustakaan', 'kantin', 'dimana belajar', 'di mana belajar'],
    async handler(ctx, lang) {
      const { getLiveLocations } = require('./headcount');
      const livePlaces = await (ctx.getLiveLocations ? ctx.getLiveLocations() : getLiveLocations());

      const busiest = livePlaces.sort((a, b) => b.active_people - a.active_people)[0];

      if (busiest && busiest.active_people > 0) {
        if (lang === 'id') {
          return `${busiest.name} lagi paling ramai, ${busiest.active_people} orang sedang belajar. Cek di Map!`;
        }
        return `${busiest.name} is the busiest right now with ${busiest.active_people} people studying. See it on the Map!`;
      }

      if (lang === 'id') {
        return 'Belum ada yang belajar. Jadi yang pertama dan buat grup!';
      }
      return 'Nobody is studying yet. Be the first and create a group!';
    }
  },

  // 9. Points & Leaderboard
  {
    id: 'points',
    en: ['point', 'points', 'score', 'rank', 'leaderboard'],
    id_kw: ['poin', 'skor', 'peringkat', 'nilai'],
    async handler(ctx, lang) {
      const [rows] = await ctx.db.query(
        `SELECT u.total_points, COALESCE(l.rank_no, 0) AS \`rank\`
         FROM users u
         LEFT JOIN leaderboard l ON l.user_id = u.id
         WHERE u.id = ?`,
        [ctx.userId]
      );
      const points = rows[0]?.total_points || 0;
      const rank = rows[0]?.rank || '-';

      if (lang === 'id') {
        return `Poinmu ${points} dan peringkatmu #${rank}. Ikut grup dan jawab pertanyaan untuk dapat poin (ada batas harian).`;
      }
      return `You have ${points} points and rank #${rank}. Join groups and answer questions to earn more (daily limits apply).`;
    }
  },

  // 10. Badges
  {
    id: 'badge',
    en: ['badge', 'badges', 'expert'],
    id_kw: ['lencana', 'keahlian', 'badge'],
    async handler(ctx, lang) {
      const [[bRow]] = await ctx.db.query('SELECT min_answers FROM badges LIMIT 1');
      const needed = bRow?.min_answers || 5;

      if (lang === 'id') {
        return `Jawab ${needed} pertanyaan di grup mata kuliah untuk mengajukan badge keahlian. Moderator yang menyetujui.`;
      }
      return `Answer ${needed} questions in a subject group to request an expertise badge. A moderator approves it.`;
    }
  },

  // 11. Organizations
  {
    id: 'organization',
    en: ['organization', 'organizations', 'verify', 'verified'],
    id_kw: ['organisasi', 'verifikasi', 'daftar organisasi'],
    async handler(ctx, lang) {
      if (lang === 'id') {
        return 'Organisasi harus diverifikasi admin dulu sebelum bisa publish event. Daftarkan organisasimu di menu Organizations.';
      }
      return 'Organizations must be verified by an admin before they can publish events. You can register yours under Organizations.';
    }
  },

  // 12. Collaboration
  {
    id: 'collaboration',
    en: ['collab', 'collaborate', 'collaboration'],
    id_kw: ['kolaborasi', 'kolab', 'kerjasama'],
    async handler(ctx, lang) {
      if (lang === 'id') {
        return 'Organisasi terverifikasi bisa membuka kolaborasi dan mengirim permintaan ke organisasi lain.';
      }
      return 'Verified organizations can open for collaboration and send requests to other organizations.';
    }
  }
];

/**
 * Main chat reply generator
 * @param {string} rawContent
 * @param {object} ctx - { user, community, db }
 */
async function getReply(rawContent, ctx) {
  try {
    const norm = normalizeText(rawContent);
    const firstName = ctx.user?.name ? ctx.user.name.split(' ')[0] : 'Student';
    const communityName = ctx.community?.name || 'the community';
    const communityOrgId = ctx.community?.organization_id || null;

    const runtimeCtx = {
      userId: ctx.user.id,
      firstName,
      communityName,
      communityOrgId,
      db: ctx.db,
      getLiveLocations: ctx.getLiveLocations
    };

    // Iterate rules in exact order
    for (const rule of RULES) {
      const dynamicKeywords = rule.id === 'subject_group'
        ? (await ctx.db.query(
          "SELECT DISTINCT subject FROM study_groups WHERE status = 'open' AND scheduled_at >= NOW()"
        ))[0].map((row) => row.subject)
        : [];

      // 1. Check Indonesian keywords first
      for (const kw of rule.id_kw) {
        if (containsWord(norm, kw) || norm.includes(kw)) {
          return await rule.handler(runtimeCtx, 'id', kw);
        }
      }

      for (const kw of dynamicKeywords) {
        if (containsWord(norm, kw) || norm.includes(kw)) {
          return await rule.handler(runtimeCtx, detectFallbackLanguage(rawContent), kw);
        }
      }

      // 2. Check English keywords
      for (const kw of rule.en) {
        if (containsWord(norm, kw) || norm.includes(kw)) {
          return await rule.handler(runtimeCtx, 'en', kw);
        }
      }
    }

    // 13. Fallback reply
    const fallbackLang = detectFallbackLanguage(rawContent);
    if (fallbackLang === 'id') {
      return 'Aku auto-reply di prototype ini, jadi hanya tahu soal event, grup belajar, tempat, poin, badge, dan organisasi. Coba tanya salah satunya ya!';
    }
    return "I'm an auto-reply in this prototype, so I only know about events, study groups, places, points, badges, and organizations. Try asking about one of those!";
  } catch (err) {
    console.error('Chatbot error:', err);
    // Handlers must never throw - return fallback
    return "I'm an auto-reply in this prototype, so I only know about events, study groups, places, points, badges, and organizations. Try asking about one of those!";
  }
}

module.exports = {
  getReply,
  RULES,
  normalizeText
};
