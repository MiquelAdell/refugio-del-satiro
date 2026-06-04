-- Add full-size image URL (separate from thumbnail used in listings)
ALTER TABLE games ADD COLUMN image_url TEXT NOT NULL DEFAULT '';
