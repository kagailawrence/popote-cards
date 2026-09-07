-- Migration 004: Operational Core Schema Extensions (Centralized Order Capture, Real-time Inventory, Routing & Tracking, Returns/Refunds)

-- 1. Extend Orders table for multi-channel order capture & fulfillment timestamps
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web', 'phone', 'agent')),
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS placed_by_admin_id UUID REFERENCES admins(id);

CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);

-- 2. Extend Order Items for COGS & print dispatch tracking
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS cogs_kes NUMERIC(10,2) DEFAULT 150.00;

-- 3. Inventory Items table (Paper stock, card boards, specialized materials per size/design)
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  size TEXT CHECK (size IN ('A3', 'A4', 'A5', 'universal')),
  stock_quantity INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  reorder_threshold INT NOT NULL DEFAULT 20,
  unit_cogs_kes NUMERIC(10,2) NOT NULL DEFAULT 150.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Inventory Audit Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  change_amount INT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('order_reserved', 'order_fulfilled', 'order_cancelled', 'manual_restock', 'refund_restock')),
  order_id UUID REFERENCES orders(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_item_id ON inventory_logs(inventory_item_id);

-- 5. Order Status Transition Logs (Timeline Audit Trail)
CREATE TABLE IF NOT EXISTS order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'system',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_id ON order_status_logs(order_id);

-- 6. Returns & Refunds extensions on Disputes
ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'approved', 'rejected', 'processed')),
  ADD COLUMN IF NOT EXISTS refund_amount_kes NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS restock_inventory BOOLEAN DEFAULT false;

-- Seed initial stock items if inventory_items is empty
INSERT INTO inventory_items (name, sku, size, stock_quantity, reserved_quantity, reorder_threshold, unit_cogs_kes)
VALUES
  ('350 GSM Heavy Board - A5 Size', 'BOARD-A5-350GSM', 'A5', 450, 0, 50, 120.00),
  ('350 GSM Heavy Board - A4 Size', 'BOARD-A4-350GSM', 'A4', 300, 0, 40, 180.00),
  ('350 GSM Heavy Board - A3 Size', 'BOARD-A3-350GSM', 'A3', 120, 0, 15, 280.00),
  ('Glossy Photo Inks & Inserts', 'INKS-GLOSS-UNIV', 'universal', 500, 0, 100, 50.00)
ON CONFLICT (sku) DO NOTHING;
