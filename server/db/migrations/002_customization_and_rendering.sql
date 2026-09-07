-- Migration 002: Card Pages, Customization Zones & Print-Ready PDF Rendering

-- Per-design customization capability flags
ALTER TABLE designs
  ADD COLUMN IF NOT EXISTS allows_custom_message BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allows_custom_photo BOOLEAN NOT NULL DEFAULT false;

-- Replaces generic design_images table with page-aware structure
CREATE TABLE IF NOT EXISTS design_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL CHECK (page_type IN ('front', 'inside_left', 'inside_right', 'back')),
  storage_path TEXT NOT NULL,
  width_px INT NOT NULL,
  height_px INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (design_id, page_type)
);
CREATE INDEX IF NOT EXISTS idx_design_pages_design_id ON design_pages(design_id);

-- Customization placement zones on card pages
CREATE TABLE IF NOT EXISTS customization_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_page_id UUID NOT NULL REFERENCES design_pages(id) ON DELETE CASCADE,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('message', 'photo')),
  x_px INT NOT NULL,
  y_px INT NOT NULL,
  width_px INT NOT NULL,
  height_px INT NOT NULL,
  font_family TEXT,
  max_font_size_px INT DEFAULT 24,
  text_align TEXT DEFAULT 'left',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (design_page_id, zone_type)
);
CREATE INDEX IF NOT EXISTS idx_customization_zones_design_page_id ON customization_zones(design_page_id);

-- Order item rendering additions
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS religion TEXT CHECK (religion IN ('christian', 'muslim', 'other')),
  ADD COLUMN IF NOT EXISTS rendered_pdf_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS render_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (render_status IN ('pending', 'rendering', 'ready', 'failed'));
CREATE INDEX IF NOT EXISTS idx_order_items_render_status ON order_items(render_status);
