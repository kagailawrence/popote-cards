-- Migration 009: Customer Reviews and Ratings
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_role TEXT NOT NULL DEFAULT 'Parent',
  school_name TEXT,
  location TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  card_type TEXT,
  category TEXT NOT NULL DEFAULT 'parent' CHECK (category IN ('parent', 'teacher', 'relative', 'other')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_category ON reviews(category);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_order_number ON reviews(order_number);
