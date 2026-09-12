-- BGG's collection API can list several distinct owned items (different
-- names/images) under the same objectid (games.bgg_id) — e.g. reskinned
-- variants BGG treats as versions of one base game. games.bgg_id was
-- previously UNIQUE, which silently collapsed those into a single row.
--
-- games.bgg_collection_id stores BGG's per-copy collection entry id
-- ("collid"), which is unique per owned item/copy. It becomes the identity
-- used for import upserts; bgg_id (objectid) stays as a non-unique
-- reference field (still used for the "view on BGG" link and for fetching
-- shared details like rating/playtime).
--
-- SQLite has no ALTER TABLE ... DROP CONSTRAINT, so dropping the UNIQUE on
-- bgg_id requires a full table rebuild. loans.game_id references games(id)
-- ON DELETE RESTRICT, so foreign key enforcement must be off for the
-- rebuild (not permitted mid-transaction) and restored after.

PRAGMA foreign_keys=OFF;

BEGIN TRANSACTION;

CREATE TABLE games_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bgg_id INTEGER NOT NULL,
    bgg_collection_id INTEGER,
    name TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    year_published INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    min_players INTEGER NOT NULL DEFAULT 0,
    max_players INTEGER NOT NULL DEFAULT 0,
    playing_time INTEGER NOT NULL DEFAULT 0,
    bgg_rating REAL NOT NULL DEFAULT 0.0,
    location TEXT NOT NULL DEFAULT 'armari',
    image_url TEXT NOT NULL DEFAULT '',
    slug TEXT NOT NULL DEFAULT '',
    item_type TEXT NOT NULL DEFAULT 'boardgame'
        CHECK (item_type IN ('boardgame', 'rpgitem')),
    description TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1
);

INSERT INTO games_new (
    id, bgg_id, bgg_collection_id, name, thumbnail_url, year_published,
    created_at, updated_at, min_players, max_players, playing_time,
    bgg_rating, location, image_url, slug, item_type, description, is_active
)
SELECT
    id, bgg_id, NULL, name, thumbnail_url, year_published,
    created_at, updated_at, min_players, max_players, playing_time,
    bgg_rating, location, image_url, slug, item_type, description, is_active
FROM games;

DROP TABLE games;

ALTER TABLE games_new RENAME TO games;

CREATE UNIQUE INDEX idx_games_slug ON games(slug) WHERE slug != '';
CREATE INDEX idx_games_item_type ON games (item_type);
CREATE UNIQUE INDEX idx_games_collection_id ON games(bgg_collection_id)
    WHERE bgg_collection_id IS NOT NULL;

COMMIT;

PRAGMA foreign_keys=ON;
