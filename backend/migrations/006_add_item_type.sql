-- Add item_type to support RPG items (libros de rol) alongside board games.
-- Add description for RPG items imported from BGG.
ALTER TABLE games ADD COLUMN item_type TEXT NOT NULL DEFAULT 'boardgame'
    CHECK (item_type IN ('boardgame', 'rpgitem'));
ALTER TABLE games ADD COLUMN description TEXT NOT NULL DEFAULT '';
CREATE INDEX idx_games_item_type ON games (item_type);
