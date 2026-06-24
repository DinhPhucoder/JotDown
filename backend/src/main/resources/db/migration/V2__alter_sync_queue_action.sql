-- Flyway Migration: Alter action column of sync_queue to VARCHAR(50)
-- This allows storing attachment action types like ATTACHMENT_ADD and ATTACHMENT_REMOVE
ALTER TABLE sync_queue MODIFY COLUMN action VARCHAR(50) NOT NULL;
