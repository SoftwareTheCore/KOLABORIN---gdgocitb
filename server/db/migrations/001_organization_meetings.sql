USE kolaborin;

CREATE TABLE IF NOT EXISTS organization_meetings (
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
