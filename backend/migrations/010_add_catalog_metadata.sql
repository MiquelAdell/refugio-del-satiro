-- Add normalized BGG/RPGGeek classifications stored as deterministic JSON arrays.
ALTER TABLE games ADD COLUMN categories_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE games ADD COLUMN publication_types_json TEXT NOT NULL DEFAULT '[]';
