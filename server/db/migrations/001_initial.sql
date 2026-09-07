-- Migration 001: Initial Schema for Success Card Delivery Platform

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin', -- 'admin' | 'super_admin' | 'rider_manager'
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

CREATE TABLE IF NOT EXISTS counties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS sub_counties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_id UUID NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  zone TEXT NOT NULL CHECK (zone IN ('cbd', 'outskirts'))
);
CREATE INDEX IF NOT EXISTS idx_subcounties_county_id ON sub_counties(county_id);

CREATE TABLE IF NOT EXISTS print_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS county_print_regions (
  county_id UUID NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
  print_region_id UUID NOT NULL REFERENCES print_regions(id) ON DELETE CASCADE,
  PRIMARY KEY (county_id, print_region_id)
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('occasion', 'style', 'religion')),
  name TEXT NOT NULL,
  UNIQUE (type, name)
);

CREATE TABLE IF NOT EXISTS designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  allows_custom_photo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS design_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  angle_order SMALLINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_design_images_design_id ON design_images(design_id);

CREATE TABLE IF NOT EXISTS design_categories (
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (design_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_design_categories_category_id ON design_categories(category_id);

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion_category_id UUID REFERENCES categories(id),
  body TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_message_templates_occasion ON message_templates(occasion_category_id);

CREATE TABLE IF NOT EXISTS prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size TEXT NOT NULL CHECK (size IN ('A3', 'A4', 'A5')),
  is_custom_photo BOOLEAN NOT NULL,
  zone TEXT NOT NULL CHECK (zone IN ('cbd', 'outskirts')),
  amount_kes NUMERIC(10,2) NOT NULL,
  UNIQUE (size, is_custom_photo, zone)
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'pending_payment',
  total_amount_kes NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES designs(id),
  size TEXT NOT NULL CHECK (size IN ('A3', 'A4', 'A5')),
  custom_photo_storage_path TEXT,
  message_body TEXT NOT NULL,
  message_font TEXT,
  message_colour TEXT,
  recipient_full_names TEXT NOT NULL,
  admission_number TEXT NOT NULL,
  school_name TEXT NOT NULL,
  county_id UUID NOT NULL REFERENCES counties(id),
  sub_county_id UUID NOT NULL REFERENCES sub_counties(id),
  po_box TEXT,
  class_form TEXT,
  unit_price_kes NUMERIC(10,2) NOT NULL,
  print_region_id UUID REFERENCES print_regions(id),
  print_status TEXT NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_print_region_id ON order_items(print_region_id);
CREATE INDEX IF NOT EXISTS idx_order_items_print_status ON order_items(print_status);

CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  checkout_request_id TEXT NOT NULL UNIQUE,
  mpesa_receipt_number TEXT UNIQUE,
  phone TEXT NOT NULL,
  amount_kes NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  raw_callback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mpesa_order_id ON mpesa_transactions(order_id);

CREATE TABLE IF NOT EXISTS riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  rider_id UUID REFERENCES riders(id),
  delivery_note_storage_path TEXT,
  delivered_at TIMESTAMPTZ,
  rider_payment_status TEXT NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_item_id ON deliveries(order_item_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_rider_id ON deliveries(rider_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_rider_payment_status ON deliveries(rider_payment_status);

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  mpesa_transaction_code TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('call', 'website')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_admin_id ON refresh_tokens(admin_id);
