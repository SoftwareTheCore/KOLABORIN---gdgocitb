require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kolaborin',
    timezone: '+07:00'
  });

  await pool.query(
    "ALTER TABLE users MODIFY role ENUM('student','organization','admin') NOT NULL DEFAULT 'student'"
  );

  console.log('Seeding database according to Section 11...');

  // Disable FK checks to clear tables
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  const tables = [
    'user_badges', 'badges', 'point_transactions', 'point_rules',
    'event_applications', 'events', 'community_messages', 'community_members',
    'communities', 'group_posts', 'study_group_members', 'study_groups',
    'place_requests', 'locations', 'collaboration_requests', 'organizations',
    'users'
  ];

  for (const t of tables) {
    await pool.query(`TRUNCATE TABLE \`${t}\``);
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  // Common password
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Point rules
  await pool.query(`
    INSERT INTO point_rules (action_type, points, daily_cap_points) VALUES
    ('join_group', 5, 15),
    ('answer_post', 10, 50),
    ('send_message', 1, 10),
    ('attend_event', 20, 40)
  `);

  // 2. Users
  const users = [
    { id: 1, email: 'admin@kolaborin.test', name: 'Admin KOLABORIN', role: 'admin', faculty: 'STEI', major: 'Informatics', points: 0 },
    { id: 2, email: 'mikail@kolaborin.test', name: 'Mikail', role: 'student', faculty: 'STEI', major: 'Informatics', points: 120 },
    { id: 3, email: 'farrel@kolaborin.test', name: 'Farrel', role: 'student', faculty: 'STEI', major: 'Information System', points: 75 },
    { id: 4, email: 'raffi@kolaborin.test', name: 'Raffi', role: 'student', faculty: 'FTI', major: 'Industrial Engineering', points: 50 },
    { id: 5, email: 'hima@kolaborin.test', name: 'Hima Admin (HMIF)', role: 'organization', faculty: 'STEI', major: 'Informatics', points: 0 },
    { id: 6, email: 'robotics@kolaborin.test', name: 'Robotics Lead', role: 'organization', faculty: 'FTMD', major: 'Mechanical Engineering', points: 0 },
    { id: 7, email: 'rani@kolaborin.test', name: 'Rani', role: 'student', faculty: 'STEI', major: 'Informatics', points: 310 },
    { id: 8, email: 'dimas@kolaborin.test', name: 'Dimas', role: 'student', faculty: 'STEI', major: 'Electrical Engineering', points: 260 },
    { id: 9, email: 'fajar@kolaborin.test', name: 'Fajar', role: 'student', faculty: 'FMIPA', major: 'Mathematics', points: 210 },
    { id: 10, email: 'sinta@kolaborin.test', name: 'Sinta', role: 'student', faculty: 'SBM', major: 'Management', points: 150 },
    { id: 11, email: 'bagas@kolaborin.test', name: 'Bagas', role: 'student', faculty: 'FTSL', major: 'Civil Engineering', points: 90 }
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name, role, faculty, major, total_points)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.email, passwordHash, u.name, u.role, u.faculty, u.major, u.points]
    );
  }

  // 3. Badges
  await pool.query(`
    INSERT INTO badges (id, name, subject, description, min_answers)
    VALUES (1, 'Database Systems Expert', 'Database Systems', 'Demonstrated exceptional knowledge by answering at least 5 questions in Database Systems study groups.', 5)
  `);

  // 4. Locations (6 active near ITB Bandung: -6.8893, 107.6104)
  const locations = [
    { id: 1, name: 'Central Library ITB', type: 'study_spot', lat: -6.8893, lng: 107.6104, desc: 'Perpustakaan pusat ITB dengan area belajar tenang dan Wi-Fi cepat.', short: 'Quiet library area with fast Wi-Fi' },
    { id: 2, name: 'Labtek V Discussion Room', type: 'meeting_room', lat: -6.8887, lng: 107.6101, desc: 'Ruang diskusi lantai 2 Labtek V STEI dengan whiteboard.', short: 'STEI discussion space with whiteboards' },
    { id: 3, name: 'Kantin Borju (Boromeus)', type: 'study_spot', lat: -6.8905, lng: 107.6112, desc: 'Kantin santai dengan banyak colokan untuk diskusi santai.', short: 'Casual spot with snacks and plugs' },
    { id: 4, name: 'West Hall (Aula Barat)', type: 'event_venue', lat: -6.8912, lng: 107.6098, desc: 'Gedung bersejarah ITB untuk seminar dan pameran teknologi.', short: 'Historic grand hall for campus events' },
    { id: 5, name: 'Taman Cinta Labtek VIII', type: 'study_spot', lat: -6.8881, lng: 107.6110, desc: 'Area terbuka hijau sejuk untuk belajar kelompok santai.', short: 'Outdoor breezy park for group prep' },
    { id: 6, name: 'Ganesha Tech Cafe', type: 'study_spot', lat: -6.8918, lng: 107.6120, desc: 'Cafe modern dekat gerbang depan ITB ramah laptop.', short: 'Cozy modern coffee spot near campus' }
  ];

  for (const l of locations) {
    await pool.query(
      `INSERT INTO locations (id, name, type, latitude, longitude, description, short_description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [l.id, l.name, l.type, l.lat, l.lng, l.desc, l.short]
    );
  }

  // 5. 1 Pending place request (for Admin queue)
  await pool.query(`
    INSERT INTO place_requests (requester_id, name, type, address, latitude, longitude, short_description, status)
    VALUES (2, 'Co-Working Space Perpustakaan Lantai 4', 'study_spot', 'Gedung Perpustakaan Pusat Lt 4', -6.8891, 107.6106, 'Area baru nyaman ber-AC untuk kolaborasi kelompok', 'pending')
  `);

  // 6. Organizations (HMIF verified, Robotics pending, GDSC verified)
  await pool.query(`
    INSERT INTO organizations (id, owner_id, name, description, category, status, open_for_collab, verified_by, verified_at)
    VALUES
    (1, 5, 'Himpunan Mahasiswa Informatika (HMIF)', 'Wadah resmi mahasiswa Informatika dan STI ITB untuk berkarya dan berjejaring.', 'Himpunan Jurusan', 'verified', TRUE, 1, NOW()),
    (2, 6, 'ITB Robotics Club', 'Klub robotika kampus untuk pengembangan riset mekanika, otomasi, dan IoT.', 'Unit Kegiatan Mahasiswa', 'pending', FALSE, NULL, NULL),
    (3, 1, 'Google Developer Groups on Campus ITB', 'Komunitas developer mahasiswa ITB yang mengeksplorasi ekosistem teknologi modern.', 'Komunitas Teknologi', 'verified', TRUE, 1, NOW())
  `);

  // 7. Study Groups (At least 6 active now within -3h to +1h)
  await pool.query(`
    INSERT INTO study_groups (id, creator_id, title, subject, description, location_id, scheduled_at, max_members, status)
    VALUES
    (1, 5, 'DB Midterm Prep', 'Database Systems', 'Bahas latihan soal SQL query, Normalisasi 3NF/BCNF, dan indexing.', 1, DATE_ADD(NOW(), INTERVAL -1 HOUR), 6, 'open'),
    (2, 7, 'Calculus II Problem Solving', 'Calculus', 'Belajar bareng integral lipat dua dan deret taylor.', 1, DATE_ADD(NOW(), INTERVAL -30 MINUTE), 8, 'open'),
    (3, 8, 'Algorithm & Data Structures Hack', 'Data Structures', 'Latihan graph traversal (BFS/DFS) dan DP bareng.', 2, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 5, 'open'),
    (4, 9, 'Linear Algebra Matrix Review', 'Linear Algebra', 'Review eigenvalue, eigenvector, dan dekomposisi matriks.', 2, DATE_ADD(NOW(), INTERVAL -2 HOUR), 4, 'open'),
    (5, 10, 'Thermodynamics Engineering Session', 'Thermodynamics', 'Siklus rankine dan efisiensi termal pembangkit daya.', 3, DATE_ADD(NOW(), INTERVAL -45 MINUTE), 6, 'open'),
    (6, 11, 'Software Engineering Architecture', 'Software Engineering', 'Diskusi Clean Architecture dan RESTful API best practices.', 6, DATE_ADD(NOW(), INTERVAL 30 MINUTE), 8, 'open'),
    (7, 3, 'Calculus Advanced Proofs', 'Calculus', 'Persiapan kuis pembuktian teorema kalkulus lanjutan.', 5, DATE_ADD(NOW(), INTERVAL 5 HOUR), 6, 'open'),
    (8, 4, 'Discrete Mathematics Graph Theory', 'Discrete Mathematics', 'Teori graf, pewarnaan graf, dan pohon rentang.', 1, DATE_ADD(NOW(), INTERVAL 6 HOUR), 8, 'open'),
    (9, 2, 'Distributed Systems Consensus', 'Distributed Systems', 'Membahas algoritma Raft dan Paxos.', 2, DATE_ADD(NOW(), INTERVAL 8 HOUR), 6, 'open'),
    (10, 7, 'Machine Learning Basics', 'Artificial Intelligence', 'Linear regression, loss functions, dan gradient descent.', 6, DATE_ADD(NOW(), INTERVAL 12 HOUR), 10, 'open'),
    (11, 8, 'Computer Networks Routing', 'Computer Networks', 'Subnetting, CIDR, dan protokol OSPF/BGP.', 3, DATE_ADD(NOW(), INTERVAL 18 HOUR), 6, 'open'),
    (12, 9, 'Operating Systems Concurrency', 'Operating Systems', 'Thread synchronization, mutex, semaphore, dan deadlock.', 2, DATE_ADD(NOW(), INTERVAL 24 HOUR), 6, 'open')
  `);

  // Memberships for active groups so live headcount shows 3, 5, 4 etc.
  await pool.query(`
    INSERT INTO study_group_members (group_id, user_id) VALUES
    (1, 5), (1, 7), (1, 8), -- Group 1 has 3 people at Library
    (2, 7), (2, 9),         -- Group 2 has 2 people at Library -> total library = 5
    (3, 8), (3, 10), (3, 3), (3, 4), -- Group 3 has 4 people at Labtek V
    (4, 9), (4, 11),                 -- Group 4 has 2 people at Labtek V -> total Labtek V = 6
    (5, 10), (5, 6), (5, 11),        -- Group 5 has 3 people at Kantin Borju
    (6, 11), (6, 3), (6, 4), (6, 7)  -- Group 6 has 4 people at Tech Cafe
  `);

  // Seed 4 answers in Database Systems for Mikail (id: 2) so 5th answer triggers badge request
  // Mikail joins group 1
  await pool.query(`
    INSERT INTO group_posts (id, group_id, user_id, parent_id, type, content) VALUES
    (1, 1, 5, NULL, 'question', 'Bagaimana cara menentukan apakah relasi memenuhi BCNF?'),
    (2, 1, 2, 1, 'answer', 'Setiap determinan fungsional non-trivial X -> Y harus memiliki X sebagai superkey yang unik.'),
    (3, 1, 7, NULL, 'question', 'Apa perbedaan clustered index dan non-clustered index?'),
    (4, 1, 2, 3, 'answer', 'Clustered index menentukan susunan fisik data pada tabel, sedangkan non-clustered index terpisah menunjuk ke data baris.'),
    (5, 1, 8, NULL, 'question', 'Kapan kita harus menggunakan denormalisasi pada schema OLTP?'),
    (6, 1, 2, 5, 'answer', 'Denormalisasi dipakai saat performa query pembacaan (read-heavy) lambat karena terlalu banyak join berat.'),
    (7, 1, 5, NULL, 'question', 'Jelaskan ACID properties dalam transaksi database.'),
    (8, 1, 2, 7, 'answer', 'Atomicity, Consistency, Isolation, dan Durability menjamin keabsahan transaksi meski terjadi kegagalan sistem.')
  `);

  // 8. Communities
  await pool.query(`
    INSERT INTO communities (id, organization_id, created_by, bot_user_id, name, description, category)
    VALUES
    (1, 1, 5, 5, 'HMIF Announcements', 'Kanal resmi informasi perkuliahan, beasiswa, dan event akademik HMIF.', 'Akademik'),
    (2, NULL, 7, 7, 'Study Together STEI', 'Komunitas santai belajar bareng mahasiswa STEI ITB lintas angkatan.', 'Komunitas'),
    (3, 2, 6, 8, 'Robotics Club Hub', 'Komunitas diskusi riset dan perakitan robot untuk perlombaan.', 'Minat Bakat')
  `);

  await pool.query(`
    INSERT INTO community_members (community_id, user_id, role) VALUES
    (1, 5, 'admin'), (1, 2, 'member'), (1, 3, 'member'), (1, 7, 'member'),
    (2, 7, 'admin'), (2, 2, 'member'), (2, 8, 'member'),
    (3, 6, 'admin'), (3, 8, 'member'), (3, 4, 'member')
  `);

  await pool.query(`
    INSERT INTO community_messages (community_id, user_id, content, is_broadcast, is_auto_reply) VALUES
    (1, 5, 'Selamat datang di grup resmi HMIF Announcements! Semua info penting akan diposting di sini.', TRUE, FALSE),
    (1, 7, 'Halo teman-teman! Ada yang tahu jadwal tutorial database minggu ini?', FALSE, FALSE),
    (1, 5, 'Tutorial diadakan hari Kamis di Labtek V jam 13.00.', FALSE, TRUE),
    (2, 7, 'Halo semua, selamat datang di Komunitas Belajar STEI!', TRUE, FALSE),
    (2, 8, 'Halo Rani! Ada yang mau belajar Algoritma bareng nanti sore?', FALSE, FALSE),
    (3, 6, 'Pengumuman: Workshop Arduino dan Sensor diadakan akhir pekan ini di Aula Barat.', TRUE, FALSE)
  `);

  await pool.query(`
    INSERT INTO community_messages (community_id, user_id, content, is_broadcast, is_auto_reply) VALUES
    (1, 5, 'Reminder: pendaftaran workshop SQL ditutup besok.', TRUE, FALSE),
    (2, 2, 'Aku ikut belajar database sore ini.', FALSE, FALSE),
    (2, 7, 'Siap, sampai ketemu di perpustakaan.', FALSE, FALSE),
    (3, 8, 'Aku bisa bantu menyiapkan sensor untuk workshop.', FALSE, FALSE),
    (3, 6, 'Mantap, kita koordinasikan di ruang Robotics.', FALSE, FALSE),
    (3, 4, 'Saya ikut bagian dokumentasi.', FALSE, FALSE)
  `);

  // Keep seeded totals backed by historical transactions without affecting today's caps.
  await pool.query(`
    INSERT INTO point_transactions (user_id, action_type, points, created_at)
    SELECT id, 'join_group', total_points, DATE_SUB(NOW(), INTERVAL 2 DAY)
    FROM users
    WHERE role = 'student' AND total_points > 0
  `);

  // 9. Published Events
  await pool.query(`
    INSERT INTO events (id, organization_id, title, description, location_id, start_at, end_at, capacity, status)
    VALUES
    (1, 1, 'Tech Talk: Scale to Millions with Microservices', 'Seminar teknologi mendalam membahas arsitektur cloud modern dan containerization.', 4, DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 3 DAY), INTERVAL 3 HOUR), 100, 'published'),
    (2, 1, 'Hands-on Workshop: SQL Optimization Mastery', 'Praktik langsung indexing, query explain plan, dan performance tuning pada MySQL.', 2, DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 5 DAY), INTERVAL 2 HOUR), 30, 'published'),
    (3, 3, 'Google Solution Challenge ITB Hackday', 'Ajang kolaborasi membangun solusi nyata berbasis Google Cloud dan AI untuk SGDs.', 4, DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 7 DAY), INTERVAL 8 HOUR), 80, 'published'),
    (4, 3, 'Intro to Flutter & Cross-Platform UI', 'Tutorial membangun antarmuka web dan mobile dalam satu codebase menggunakan Flutter.', 1, DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 10 DAY), INTERVAL 3 HOUR), 40, 'published'),
    (5, 1, 'Career Prep: Software Engineering Mock Interview', 'Sesi latihan wawancara teknis dan review resume bersama para alumni industri teknologi.', 6, DATE_ADD(NOW(), INTERVAL 14 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 14 DAY), INTERVAL 4 HOUR), 25, 'published')
  `);

  await pool.query(`
    INSERT INTO event_applications (event_id, user_id, message, status) VALUES
    (1, 3, 'Tertarik mendalami arsitektur microservices untuk tugas akhir.', 'pending'),
    (1, 4, 'Ingin menambah wawasan tentang scalable backend systems.', 'accepted')
  `);

  console.log('Database seeded successfully!');
  await pool.end();
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = seed;
