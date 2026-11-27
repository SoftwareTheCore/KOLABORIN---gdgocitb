USE kolaborin;

ALTER TABLE users
  ADD COLUMN avatar_data MEDIUMTEXT NULL;

CREATE TABLE study_group_membership_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  ended_by INT NULL,
  end_reason ENUM('left', 'kicked') NULL,
  INDEX idx_membership_history_user (user_id, joined_at),
  INDEX idx_membership_history_group (group_id, user_id, ended_at),
  FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ended_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO study_group_membership_history (group_id, user_id, joined_at)
SELECT group_id, user_id, joined_at
FROM study_group_members;
