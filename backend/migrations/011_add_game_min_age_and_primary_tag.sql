-- Add BGG-derived minimum age and primary subdomain tag for catalog cards.
ALTER TABLE games ADD COLUMN min_age INTEGER NOT NULL DEFAULT 0;
ALTER TABLE games ADD COLUMN primary_tag TEXT NOT NULL DEFAULT '';
