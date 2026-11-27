USE kolaborin;

CREATE TABLE location_ratings (
  location_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (location_id, user_id),
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE study_group_members
  ADD COLUMN ticket_code CHAR(64) NULL,
  ADD COLUMN checked_in_at DATETIME NULL,
  ADD COLUMN checked_in_by INT NULL,
  ADD UNIQUE KEY uq_group_ticket_code (ticket_code),
  ADD INDEX idx_group_check_in (group_id, checked_in_at),
  ADD CONSTRAINT fk_group_members_checked_in_by
    FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL;
