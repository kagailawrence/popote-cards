-- Migration 010: Ensure unique constraint on sub_counties(county_id, name) and clean duplicates

-- 1. Re-point any order_items referencing duplicate sub_counties to the primary ID
WITH duplicates AS (
  SELECT a.id AS old_id, b.id AS new_id
  FROM sub_counties a
  JOIN sub_counties b ON a.county_id = b.county_id AND a.name = b.name AND a.id > b.id
)
UPDATE order_items oi
SET sub_county_id = d.new_id
FROM duplicates d
WHERE oi.sub_county_id = d.old_id;

-- 2. Remove duplicate sub-counties
DELETE FROM sub_counties a
USING sub_counties b
WHERE a.county_id = b.county_id
  AND a.name = b.name
  AND a.id > b.id;

-- 3. Add unique constraint on (county_id, name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_sub_county_per_county'
  ) THEN
    ALTER TABLE sub_counties
      ADD CONSTRAINT unique_sub_county_per_county UNIQUE (county_id, name);
  END IF;
END $$;

