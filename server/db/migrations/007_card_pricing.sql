-- Migration 007: Add price_kes, compare_at_price_kes, and discount_percent to designs table
ALTER TABLE designs
  ADD COLUMN IF NOT EXISTS price_kes NUMERIC(10, 2) NOT NULL DEFAULT 850.00,
  ADD COLUMN IF NOT EXISTS compare_at_price_kes NUMERIC(10, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT NULL;

UPDATE designs
SET price_kes = 850.00
WHERE price_kes IS NULL;
