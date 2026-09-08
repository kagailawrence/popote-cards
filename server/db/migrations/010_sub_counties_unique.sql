-- Migration 010: Ensure print_regions has operational hub columns & sub_counties unique constraint

-- 1. Extend print_regions with operational hub columns
ALTER TABLE print_regions
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'standby', 'maintenance')),
  ADD COLUMN IF NOT EXISTS cost_per_card_kes NUMERIC(10,2) NOT NULL DEFAULT 150.00,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Re-point any order_items referencing duplicate sub_counties to the primary ID
WITH duplicates AS (
  SELECT a.id AS old_id, b.id AS new_id
  FROM sub_counties a
  JOIN sub_counties b ON a.county_id = b.county_id AND a.name = b.name AND a.id > b.id
)
UPDATE order_items oi
SET sub_county_id = d.new_id
FROM duplicates d
WHERE oi.sub_county_id = d.old_id;

-- 3. Remove duplicate sub-counties
DELETE FROM sub_counties a
USING sub_counties b
WHERE a.county_id = b.county_id
  AND a.name = b.name
  AND a.id > b.id;

-- 4. Add unique constraint on sub_counties(county_id, name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_sub_county_per_county'
  ) THEN
    ALTER TABLE sub_counties
      ADD CONSTRAINT unique_sub_county_per_county UNIQUE (county_id, name);
  END IF;
END $$;


