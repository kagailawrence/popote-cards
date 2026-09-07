-- Migration 008: Add 3-size pricing (A5, A4, A3) to designs table
ALTER TABLE designs
  ADD COLUMN IF NOT EXISTS price_a5_kes NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  ADD COLUMN IF NOT EXISTS price_a4_kes NUMERIC(10, 2) NOT NULL DEFAULT 850.00,
  ADD COLUMN IF NOT EXISTS price_a3_kes NUMERIC(10, 2) NOT NULL DEFAULT 1400.00,
  ADD COLUMN IF NOT EXISTS compare_at_a5_kes NUMERIC(10, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS compare_at_a4_kes NUMERIC(10, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS compare_at_a3_kes NUMERIC(10, 2) DEFAULT NULL;

-- Backfill from existing price_kes if present
UPDATE designs
SET 
  price_a4_kes = COALESCE(price_kes, 850.00),
  price_a5_kes = ROUND(COALESCE(price_kes, 850.00) * 0.65),
  price_a3_kes = ROUND(COALESCE(price_kes, 850.00) * 1.65)
WHERE price_a4_kes IS NULL OR price_a5_kes IS NULL OR price_a3_kes IS NULL;
