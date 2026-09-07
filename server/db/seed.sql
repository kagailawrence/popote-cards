-- Seed data for Success Card Delivery Platform

-- Default Admin (Password: Admin123!)
INSERT INTO admins (email, password_hash, role)
VALUES ('admin@fair.co.ke', '$2b$12$ukbIvQX2/NSrzbh0Kzyvr.tw61XRjJLN3fBAfC2XA8v4kGBMkr5yO', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Print Regions
INSERT INTO print_regions (name) VALUES
  ('Nairobi'),
  ('Central'),
  ('Coast'),
  ('Rift Valley'),
  ('Western'),
  ('Nyanza'),
  ('Eastern'),
  ('North Eastern')
ON CONFLICT (name) DO NOTHING;

-- Categories
INSERT INTO categories (type, name) VALUES
  ('occasion', 'Birthday'),
  ('occasion', 'Achievement'),
  ('occasion', 'Encouragement'),
  ('occasion', 'Graduation'),
  ('style', 'Minimalist'),
  ('style', 'Bold'),
  ('style', 'Elegant'),
  ('religion', 'Christian'),
  ('religion', 'Secular')
ON CONFLICT (type, name) DO NOTHING;

-- Prices (size, is_custom_photo, zone, amount_kes)
INSERT INTO prices (size, is_custom_photo, zone, amount_kes) VALUES
  ('A5', false, 'cbd', 500.00),
  ('A5', false, 'outskirts', 650.00),
  ('A5', true,  'cbd', 650.00),
  ('A5', true,  'outskirts', 800.00),
  ('A4', false, 'cbd', 850.00),
  ('A4', false, 'outskirts', 1000.00),
  ('A4', true,  'cbd', 1050.00),
  ('A4', true,  'outskirts', 1200.00),
  ('A3', false, 'cbd', 1300.00),
  ('A3', false, 'outskirts', 1500.00),
  ('A3', true,  'cbd', 1500.00),
  ('A3', true,  'outskirts', 1750.00)
ON CONFLICT (size, is_custom_photo, zone) DO UPDATE SET amount_kes = EXCLUDED.amount_kes;

-- Sample Counties & Sub-Counties
WITH nairobi AS (
  INSERT INTO counties (name) VALUES ('Nairobi') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id
),
kiambu AS (
  INSERT INTO counties (name) VALUES ('Kiambu') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id
),
mombasa AS (
  INSERT INTO counties (name) VALUES ('Mombasa') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id
),
nakuru AS (
  INSERT INTO counties (name) VALUES ('Nakuru') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id
)
INSERT INTO sub_counties (county_id, name, zone)
SELECT id, 'Starehe (CBD)', 'cbd' FROM nairobi
UNION ALL SELECT id, 'Westlands', 'outskirts' FROM nairobi
UNION ALL SELECT id, 'Thika Town', 'cbd' FROM kiambu
UNION ALL SELECT id, 'Riru', 'outskirts' FROM kiambu
UNION ALL SELECT id, 'Mvita (CBD)', 'cbd' FROM mombasa
UNION ALL SELECT id, 'Nyali', 'outskirts' FROM mombasa
UNION ALL SELECT id, 'Nakuru Town CBD', 'cbd' FROM nakuru
UNION ALL SELECT id, 'Naivasha', 'outskirts' FROM nakuru
ON CONFLICT DO NOTHING;

-- Map Counties to Print Regions
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Nairobi' AND pr.name = 'Nairobi'
UNION ALL SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Kiambu' AND pr.name = 'Central'
UNION ALL SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Mombasa' AND pr.name = 'Coast'
UNION ALL SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Nakuru' AND pr.name = 'Rift Valley'
ON CONFLICT DO NOTHING;

-- Sample Designs
INSERT INTO designs (name, description, is_active, allows_custom_photo)
VALUES 
  ('A New Dawn', 'Bright and uplifting design with radiant sunrise gradient.', true, true),
  ('You Did It', 'Bold typography celebrating milestones and major victories.', true, false),
  ('Keep Going', 'Minimalist encouragement card with gold foil accent aesthetics.', true, true),
  ('Grace & Glory', 'Elegant card for spiritual or religious congratulations.', true, false)
ON CONFLICT DO NOTHING;

-- Message Templates
INSERT INTO message_templates (occasion_category_id, body)
SELECT id, 'Wishing you a day filled with joy, laughter, and endless success on your journey ahead!'
FROM categories WHERE name = 'Birthday' LIMIT 1;

INSERT INTO message_templates (occasion_category_id, body)
SELECT id, 'Congratulations on this milestone! Your hard work and dedication have truly paid off.'
FROM categories WHERE name = 'Achievement' LIMIT 1;

INSERT INTO message_templates (occasion_category_id, body)
SELECT id, 'Keep pushing forward. Every small step counts towards your big dream!'
FROM categories WHERE name = 'Encouragement' LIMIT 1;
