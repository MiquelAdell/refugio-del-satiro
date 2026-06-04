-- Add URL-friendly slug for games. Backfilled by the migration runner
-- (see runner.py POST_MIGRATION_HOOKS). The unique index is partial so the
-- post-migration backfill can populate slugs without violating uniqueness.
ALTER TABLE games ADD COLUMN slug TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX idx_games_slug ON games(slug) WHERE slug != '';
