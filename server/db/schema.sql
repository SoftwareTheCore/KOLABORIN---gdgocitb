CREATE DATABASE IF NOT EXISTS kolaborin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kolaborin;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('student','organization','admin') NOT NULL DEFAULT 'student',
  faculty VARCHAR(100), major VARCHAR(100), bio TEXT,
  total_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(60),
  status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  verified_by INT NULL,
  verified_at TIMESTAMP NULL,
  open_for_collab BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE TABLE collaboration_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_org_id INT NOT NULL,
  to_org_id INT NOT NULL,
  message TEXT,
  status ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (to_org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('study_spot','meeting_room','event_venue') NOT NULL,
  address VARCHAR(255),
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  description TEXT,
  short_description VARCHAR(200) NULL,
  owner_id INT NULL,
  organization_id INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

CREATE TABLE location_ratings (
  location_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (location_id, user_id),
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE place_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id INT NOT NULL,
  organization_id INT NULL,
  name VARCHAR(150) NOT NULL,
  type ENUM('study_spot','meeting_room','event_venue') NOT NULL,
  address VARCHAR(255),
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  short_description VARCHAR(200),
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE study_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  description TEXT,
  location_id INT,
  scheduled_at DATETIME,
  max_members INT NOT NULL DEFAULT 8,
  status ENUM('open','full','closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_group_loc (location_id, status, scheduled_at),
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE study_group_members (
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ticket_code CHAR(64) NULL,
  checked_in_at DATETIME NULL,
  checked_in_by INT NULL,
  PRIMARY KEY (group_id, user_id),
  UNIQUE KEY uq_group_ticket_code (ticket_code),
  INDEX idx_group_check_in (group_id, checked_in_at),
  FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE group_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id INT NULL,
  type ENUM('question','answer','note') NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES group_posts(id) ON DELETE CASCADE
);

CREATE TABLE communities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NULL,
  created_by INT NOT NULL,
  bot_user_id INT NULL,                 -- persona user that sends auto-replies
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(60),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (bot_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE community_members (
  community_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('admin','member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (community_id, user_id),
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE community_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  community_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  is_broadcast BOOLEAN NOT NULL DEFAULT FALSE,
  is_auto_reply BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_time (community_id, created_at),
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  location_id INT,
  start_at DATETIME NOT NULL,
  end_at DATETIME,
  capacity INT,
  status ENUM('draft','published','cancelled') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE event_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  message TEXT,
  status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  ticket_code CHAR(64) NULL,
  checked_in_at DATETIME NULL,
  checked_in_by INT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_user (event_id, user_id),
  UNIQUE KEY uq_event_ticket_code (ticket_code),
  INDEX idx_event_status (event_id, status),
  INDEX idx_event_check_in (event_id, checked_in_at),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE organization_meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  location_id INT NOT NULL,
  created_by INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  status ENUM('scheduled','cancelled') NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_org_meeting_time (organization_id, status, start_at),
  INDEX idx_room_meeting_time (location_id, status, start_at, end_at),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE point_rules (
  action_type VARCHAR(40) PRIMARY KEY,
  points INT NOT NULL,
  daily_cap_points INT NOT NULL
);

CREATE TABLE point_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action_type VARCHAR(40) NOT NULL,
  points INT NOT NULL,
  group_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_day (user_id, action_type, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (action_type) REFERENCES point_rules(action_type),
  FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE SET NULL
);

CREATE TABLE badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  description TEXT,
  min_answers INT NOT NULL DEFAULT 5
);

CREATE TABLE user_badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  badge_id INT NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  approved_by INT NULL,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  UNIQUE KEY uq_user_badge (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE VIEW leaderboard AS
SELECT id AS user_id, name, faculty, total_points,
       RANK() OVER (ORDER BY total_points DESC) AS rank_no
FROM users WHERE role = 'student';
