-- Spanish translation of the BGG description, cached by source-content hash.
-- description_es_source_hash is sha256(description) of the English text the
-- translation was made from; a mismatch means the source changed and the row
-- needs re-translation.
ALTER TABLE games ADD COLUMN description_es TEXT NOT NULL DEFAULT '';
ALTER TABLE games ADD COLUMN description_es_source_hash TEXT NOT NULL DEFAULT '';
