-- Migration 006: Add card_type and default_message to designs table
ALTER TABLE designs
  ADD COLUMN IF NOT EXISTS card_type TEXT NOT NULL DEFAULT 'customizable' CHECK (card_type IN ('standard', 'customizable')),
  ADD COLUMN IF NOT EXISTS default_message TEXT;

-- Update existing designs based on allows_custom_message
UPDATE designs
SET card_type = CASE WHEN allows_custom_message = false THEN 'standard' ELSE 'customizable' END
WHERE card_type IS NULL;
