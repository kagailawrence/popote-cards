-- Migration 003: Add thumbnail_path to designs table
ALTER TABLE designs
  ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;
