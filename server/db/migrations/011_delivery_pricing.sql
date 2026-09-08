-- Migration 011: Delivery Pricing for CBD and Outskirts
CREATE TABLE IF NOT EXISTS delivery_pricing (
  zone TEXT PRIMARY KEY CHECK (zone IN ('cbd', 'outskirts')),
  amount_kes NUMERIC(10, 2) NOT NULL,
  label TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO delivery_pricing (zone, amount_kes, label)
VALUES 
  ('cbd', 150.00, 'Town Center & CBD Express Rider Delivery'),
  ('outskirts', 300.00, 'Outskirts & Rural Regional Delivery')
ON CONFLICT (zone) DO UPDATE SET
  amount_kes = EXCLUDED.amount_kes,
  label = EXCLUDED.label;
