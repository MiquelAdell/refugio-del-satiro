-- Add is_active column to games table so BGG re-import can soft-delete
-- items still on loan instead of hard-deleting them
ALTER TABLE games ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
