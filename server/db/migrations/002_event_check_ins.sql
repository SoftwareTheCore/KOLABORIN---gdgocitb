USE kolaborin;

ALTER TABLE event_applications
  ADD COLUMN ticket_code CHAR(64) NULL,
  ADD COLUMN checked_in_at DATETIME NULL,
  ADD COLUMN checked_in_by INT NULL,
  ADD UNIQUE KEY uq_event_ticket_code (ticket_code),
  ADD INDEX idx_event_check_in (event_id, checked_in_at),
  ADD CONSTRAINT fk_event_applications_checked_in_by
    FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL;
