UPDATE games
SET location = CASE location
    WHEN 'armari' THEN 'armario'
    WHEN 'soterrani' THEN 'sotano'
    ELSE location
END
WHERE location IN ('armari', 'soterrani');
