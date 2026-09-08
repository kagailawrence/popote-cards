-- Seed data for Success Card Delivery Platform
-- Complete Kenyan Counties, Sub-Counties, Delivery Zones & Operational Setup

-- 1. Default Admins (Password: Admin123!)
INSERT INTO admins (email, password_hash, role)
VALUES 
  ('admin@popotecards.co.ke', 'b2/NSrzbh0Kzyvr.tw61XRjJLN3fBAfC2XA8v4kGBMkr5yO', 'super_admin'),
  ('admin@fair.co.ke', 'b2/NSrzbh0Kzyvr.tw61XRjJLN3fBAfC2XA8v4kGBMkr5yO', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- 2. Print Regions (Hubs)
INSERT INTO print_regions (name, contact_person, phone, whatsapp_number, email, address, status, cost_per_card_kes)
VALUES
  ('Nairobi', 'Kariuki Mwangi', '0712345678', '254712345678', 'nairobi@printpartner.co.ke', 'Kirinyaga Road, Nairobi CBD', 'active', 120.00),
  ('Central', 'Peter Githinji', '0722114455', '254722114455', 'central@printpartner.co.ke', 'Kimathi Way, Nyeri', 'active', 150.00),
  ('Coast', 'Amina Hassan', '0733889900', '254733889900', 'coast@printpartner.co.ke', 'Digo Road, Mvita, Mombasa', 'active', 160.00),
  ('Rift Valley', 'David Kiprono', '0721778899', '254721778899', 'riftvalley@printpartner.co.ke', 'Kenyatta Avenue, Nakuru', 'active', 150.00),
  ('Western', 'Grace Wamalwa', '0725667788', '254725667788', 'western@printpartner.co.ke', 'Kenyatta Way, Kakamega', 'active', 150.00),
  ('Nyanza', 'Otieno Omondi', '0711223344', '254711223344', 'nyanza@printpartner.co.ke', 'Oginga Odinga Street, Kisumu', 'active', 150.00),
  ('Eastern', 'Faith Mutua', '0720334455', '254720334455', 'eastern@printpartner.co.ke', 'Syokimau Avenue, Machakos', 'active', 150.00),
  ('North Eastern', 'Abdi Noor', '0719887766', '254719887766', 'northeastern@printpartner.co.ke', 'Kismayu Road, Garissa', 'active', 180.00)
ON CONFLICT (name) DO UPDATE SET
  contact_person = COALESCE(print_regions.contact_person, EXCLUDED.contact_person),
  phone = COALESCE(print_regions.phone, EXCLUDED.phone),
  whatsapp_number = COALESCE(print_regions.whatsapp_number, EXCLUDED.whatsapp_number),
  cost_per_card_kes = COALESCE(print_regions.cost_per_card_kes, EXCLUDED.cost_per_card_kes);

-- 3. Categories
INSERT INTO categories (type, name) VALUES
  ('occasion', 'KCSE Success'),
  ('occasion', 'KPSEA / KCPE Success'),
  ('occasion', 'General Exam Success'),
  ('occasion', 'Graduation'),
  ('occasion', 'Birthday'),
  ('occasion', 'Achievement'),
  ('occasion', 'Encouragement'),
  ('style', 'Minimalist'),
  ('style', 'Bold & Vibrant'),
  ('style', 'Elegant Gold Foil'),
  ('religion', 'Christian'),
  ('religion', 'Muslim'),
  ('religion', 'Secular')
ON CONFLICT (type, name) DO NOTHING;

-- 4. Standard Pricing Matrix
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

-- 5. Designs
INSERT INTO designs (name, description, is_active, allows_custom_photo, card_type, allows_custom_message)
VALUES 
  ('A New Dawn', 'Bright and uplifting design with radiant sunrise gradient.', true, true, 'customizable', true),
  ('You Did It', 'Bold typography celebrating milestones and major victories.', true, false, 'customizable', true),
  ('Keep Going', 'Minimalist encouragement card with gold foil accent aesthetics.', true, true, 'customizable', true),
  ('Grace & Glory', 'Elegant card for spiritual or religious congratulations.', true, false, 'customizable', true),
  ('Golden Excellence', 'Premium framed golden crest design for academic achievers.', true, true, 'customizable', true)
ON CONFLICT DO NOTHING;

-- 6. Message Templates
INSERT INTO message_templates (occasion_category_id, body)
SELECT id, 'Wishing you clarity of mind, peace, and great triumph in your exams! You are prepared and capable.'
FROM categories WHERE name = 'KCSE Success' LIMIT 1;

INSERT INTO message_templates (occasion_category_id, body)
SELECT id, 'Congratulations on this milestone! Your hard work, discipline, and dedication have truly paid off.'
FROM categories WHERE name = 'Achievement' LIMIT 1;

INSERT INTO message_templates (occasion_category_id, body)
SELECT id, 'Keep pushing forward. Every small step counts towards your big dream!'
FROM categories WHERE name = 'Encouragement' LIMIT 1;

-- 7. All 47 Counties of Kenya
INSERT INTO counties (name) VALUES
  ('Mombasa'),
  ('Kwale'),
  ('Kilifi'),
  ('Tana River'),
  ('Lamu'),
  ('Taita-Taveta'),
  ('Garissa'),
  ('Wajir'),
  ('Mandera'),
  ('Marsabit'),
  ('Isiolo'),
  ('Meru'),
  ('Tharaka-Nithi'),
  ('Embu'),
  ('Kitui'),
  ('Machakos'),
  ('Makueni'),
  ('Nyandarua'),
  ('Nyeri'),
  ('Kirinyaga'),
  ('Murang''a'),
  ('Kiambu'),
  ('Turkana'),
  ('West Pokot'),
  ('Samburu'),
  ('Trans-Nzoia'),
  ('Uasin Gishu'),
  ('Elgeyo-Marakwet'),
  ('Nandi'),
  ('Baringo'),
  ('Laikipia'),
  ('Nakuru'),
  ('Narok'),
  ('Kajiado'),
  ('Kericho'),
  ('Bomet'),
  ('Kakamega'),
  ('Vihiga'),
  ('Bungoma'),
  ('Busia'),
  ('Siaya'),
  ('Kisumu'),
  ('Homa Bay'),
  ('Migori'),
  ('Kisii'),
  ('Nyamira'),
  ('Nairobi')
ON CONFLICT (name) DO NOTHING;

-- 8. Print Region Mappings for all 47 Counties
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Mombasa' AND pr.name = 'Coast'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Kwale' AND pr.name = 'Coast'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Kilifi' AND pr.name = 'Coast'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Tana River' AND pr.name = 'Coast'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Lamu' AND pr.name = 'Coast'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Taita-Taveta' AND pr.name = 'Coast'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Garissa' AND pr.name = 'North Eastern'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Wajir' AND pr.name = 'North Eastern'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Mandera' AND pr.name = 'North Eastern'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Marsabit' AND pr.name = 'Eastern'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Isiolo' AND pr.name = 'Eastern'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Meru' AND pr.name = 'Eastern'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Tharaka-Nithi' AND pr.name = 'Eastern'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Embu' AND pr.name = 'Eastern'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Kitui' AND pr.name = 'Eastern'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Machakos' AND pr.name = 'Eastern'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Makueni' AND pr.name = 'Eastern'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Nyandarua' AND pr.name = 'Central'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Nyeri' AND pr.name = 'Central'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Kirinyaga' AND pr.name = 'Central'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Murang''a' AND pr.name = 'Central'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Kiambu' AND pr.name = 'Central'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Turkana' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'West Pokot' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Samburu' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Trans-Nzoia' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Uasin Gishu' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Elgeyo-Marakwet' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Nandi' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Baringo' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Laikipia' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Nakuru' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Narok' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Kajiado' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Kericho' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Bomet' AND pr.name = 'Rift Valley'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Kakamega' AND pr.name = 'Western'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Vihiga' AND pr.name = 'Western'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Bungoma' AND pr.name = 'Western'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Busia' AND pr.name = 'Western'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Siaya' AND pr.name = 'Nyanza'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Kisumu' AND pr.name = 'Nyanza'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Homa Bay' AND pr.name = 'Nyanza'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Migori' AND pr.name = 'Nyanza'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Kisii' AND pr.name = 'Nyanza'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Nyamira' AND pr.name = 'Nyanza'
ON CONFLICT (county_id, print_region_id) DO NOTHING;
INSERT INTO county_print_regions (county_id, print_region_id)
SELECT c.id, pr.id FROM counties c, print_regions pr WHERE c.name = 'Nairobi' AND pr.name = 'Nairobi'
ON CONFLICT (county_id, print_region_id) DO NOTHING;

-- 9. Sub-Counties & Delivery Zones (CBD vs Outskirts)
-- Mombasa
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mvita (CBD)', 'cbd' FROM counties WHERE name = 'Mombasa' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nyali', 'outskirts' FROM counties WHERE name = 'Mombasa' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Changamwe', 'outskirts' FROM counties WHERE name = 'Mombasa' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kisauni', 'outskirts' FROM counties WHERE name = 'Mombasa' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Likoni', 'outskirts' FROM counties WHERE name = 'Mombasa' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Jomvu', 'outskirts' FROM counties WHERE name = 'Mombasa' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Kwale
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Matuga (CBD)', 'cbd' FROM counties WHERE name = 'Kwale' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Msambweni', 'outskirts' FROM counties WHERE name = 'Kwale' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Lunga Lunga', 'outskirts' FROM counties WHERE name = 'Kwale' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kinango', 'outskirts' FROM counties WHERE name = 'Kwale' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Kilifi
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kilifi North (CBD)', 'cbd' FROM counties WHERE name = 'Kilifi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kilifi South', 'outskirts' FROM counties WHERE name = 'Kilifi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Malindi', 'outskirts' FROM counties WHERE name = 'Kilifi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Magarini', 'outskirts' FROM counties WHERE name = 'Kilifi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kaloleni', 'outskirts' FROM counties WHERE name = 'Kilifi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Rabai', 'outskirts' FROM counties WHERE name = 'Kilifi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ganze', 'outskirts' FROM counties WHERE name = 'Kilifi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Tana River
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Hola (CBD)', 'cbd' FROM counties WHERE name = 'Tana River' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Garsen', 'outskirts' FROM counties WHERE name = 'Tana River' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Bura', 'outskirts' FROM counties WHERE name = 'Tana River' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Lamu
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Lamu Island (CBD)', 'cbd' FROM counties WHERE name = 'Lamu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Lamu West', 'outskirts' FROM counties WHERE name = 'Lamu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Lamu East', 'outskirts' FROM counties WHERE name = 'Lamu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Taita-Taveta
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Voi (CBD)', 'cbd' FROM counties WHERE name = 'Taita-Taveta' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Wundanyi', 'outskirts' FROM counties WHERE name = 'Taita-Taveta' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Taveta', 'outskirts' FROM counties WHERE name = 'Taita-Taveta' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mwatate', 'outskirts' FROM counties WHERE name = 'Taita-Taveta' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Garissa
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Garissa Township (CBD)', 'cbd' FROM counties WHERE name = 'Garissa' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Dadaab', 'outskirts' FROM counties WHERE name = 'Garissa' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Fafi', 'outskirts' FROM counties WHERE name = 'Garissa' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ijara', 'outskirts' FROM counties WHERE name = 'Garissa' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Balambala', 'outskirts' FROM counties WHERE name = 'Garissa' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Lagdera', 'outskirts' FROM counties WHERE name = 'Garissa' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Wajir
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Wajir East (CBD)', 'cbd' FROM counties WHERE name = 'Wajir' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Wajir North', 'outskirts' FROM counties WHERE name = 'Wajir' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Wajir South', 'outskirts' FROM counties WHERE name = 'Wajir' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Wajir West', 'outskirts' FROM counties WHERE name = 'Wajir' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Eldas', 'outskirts' FROM counties WHERE name = 'Wajir' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Tarbaj', 'outskirts' FROM counties WHERE name = 'Wajir' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Mandera
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mandera East (CBD)', 'cbd' FROM counties WHERE name = 'Mandera' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mandera North', 'outskirts' FROM counties WHERE name = 'Mandera' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mandera South', 'outskirts' FROM counties WHERE name = 'Mandera' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mandera West', 'outskirts' FROM counties WHERE name = 'Mandera' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Banissa', 'outskirts' FROM counties WHERE name = 'Mandera' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Lafey', 'outskirts' FROM counties WHERE name = 'Mandera' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Marsabit
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Marsabit Central (CBD)', 'cbd' FROM counties WHERE name = 'Marsabit' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Saku', 'outskirts' FROM counties WHERE name = 'Marsabit' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Laisamis', 'outskirts' FROM counties WHERE name = 'Marsabit' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'North Horr', 'outskirts' FROM counties WHERE name = 'Marsabit' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Moyale', 'outskirts' FROM counties WHERE name = 'Marsabit' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Isiolo
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Isiolo Town (CBD)', 'cbd' FROM counties WHERE name = 'Isiolo' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Merti', 'outskirts' FROM counties WHERE name = 'Isiolo' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Garbatulla', 'outskirts' FROM counties WHERE name = 'Isiolo' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Meru
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Imenti North (Meru CBD)', 'cbd' FROM counties WHERE name = 'Meru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Imenti South', 'outskirts' FROM counties WHERE name = 'Meru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Imenti Central', 'outskirts' FROM counties WHERE name = 'Meru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Buuri', 'outskirts' FROM counties WHERE name = 'Meru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Tigania East', 'outskirts' FROM counties WHERE name = 'Meru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Tigania West', 'outskirts' FROM counties WHERE name = 'Meru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Igembe South', 'outskirts' FROM counties WHERE name = 'Meru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Igembe Central', 'outskirts' FROM counties WHERE name = 'Meru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Igembe North', 'outskirts' FROM counties WHERE name = 'Meru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Tharaka-Nithi
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Chuka (CBD)', 'cbd' FROM counties WHERE name = 'Tharaka-Nithi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Tharaka North', 'outskirts' FROM counties WHERE name = 'Tharaka-Nithi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Tharaka South', 'outskirts' FROM counties WHERE name = 'Tharaka-Nithi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Maara', 'outskirts' FROM counties WHERE name = 'Tharaka-Nithi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Embu
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Embu Town (CBD)', 'cbd' FROM counties WHERE name = 'Embu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Manyatta', 'outskirts' FROM counties WHERE name = 'Embu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Runyenjes', 'outskirts' FROM counties WHERE name = 'Embu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mbeere North', 'outskirts' FROM counties WHERE name = 'Embu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mbeere South', 'outskirts' FROM counties WHERE name = 'Embu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Kitui
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kitui Central (CBD)', 'cbd' FROM counties WHERE name = 'Kitui' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kitui Rural', 'outskirts' FROM counties WHERE name = 'Kitui' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kitui West', 'outskirts' FROM counties WHERE name = 'Kitui' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kitui East', 'outskirts' FROM counties WHERE name = 'Kitui' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kitui South', 'outskirts' FROM counties WHERE name = 'Kitui' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mwingi North', 'outskirts' FROM counties WHERE name = 'Kitui' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mwingi Central', 'outskirts' FROM counties WHERE name = 'Kitui' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mwingi West', 'outskirts' FROM counties WHERE name = 'Kitui' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Machakos
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Machakos Town (CBD)', 'cbd' FROM counties WHERE name = 'Machakos' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mavoko (Athi River)', 'outskirts' FROM counties WHERE name = 'Machakos' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kathiani', 'outskirts' FROM counties WHERE name = 'Machakos' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kangundo', 'outskirts' FROM counties WHERE name = 'Machakos' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Matungulu', 'outskirts' FROM counties WHERE name = 'Machakos' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Yatta', 'outskirts' FROM counties WHERE name = 'Machakos' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Masinga', 'outskirts' FROM counties WHERE name = 'Machakos' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mwala', 'outskirts' FROM counties WHERE name = 'Machakos' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Makueni
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Wote (CBD)', 'cbd' FROM counties WHERE name = 'Makueni' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kaiti', 'outskirts' FROM counties WHERE name = 'Makueni' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kibwezi East', 'outskirts' FROM counties WHERE name = 'Makueni' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kibwezi West', 'outskirts' FROM counties WHERE name = 'Makueni' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kilome', 'outskirts' FROM counties WHERE name = 'Makueni' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Makueni', 'outskirts' FROM counties WHERE name = 'Makueni' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Nyandarua
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ol Kalou (CBD)', 'cbd' FROM counties WHERE name = 'Nyandarua' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kinangop', 'outskirts' FROM counties WHERE name = 'Nyandarua' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kipipiri', 'outskirts' FROM counties WHERE name = 'Nyandarua' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ndaragwa', 'outskirts' FROM counties WHERE name = 'Nyandarua' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ol Joro Orok', 'outskirts' FROM counties WHERE name = 'Nyandarua' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Nyeri
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nyeri Town (CBD)', 'cbd' FROM counties WHERE name = 'Nyeri' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Tetu', 'outskirts' FROM counties WHERE name = 'Nyeri' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kieni', 'outskirts' FROM counties WHERE name = 'Nyeri' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mathira', 'outskirts' FROM counties WHERE name = 'Nyeri' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Othaya', 'outskirts' FROM counties WHERE name = 'Nyeri' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mukurweini', 'outskirts' FROM counties WHERE name = 'Nyeri' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Kirinyaga
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kerugoya (CBD)', 'cbd' FROM counties WHERE name = 'Kirinyaga' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kutus', 'outskirts' FROM counties WHERE name = 'Kirinyaga' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mwea', 'outskirts' FROM counties WHERE name = 'Kirinyaga' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Gichugu', 'outskirts' FROM counties WHERE name = 'Kirinyaga' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ndia', 'outskirts' FROM counties WHERE name = 'Kirinyaga' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Murang'a
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Murang''a Town (CBD)', 'cbd' FROM counties WHERE name = 'Murang''a' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kigumo', 'outskirts' FROM counties WHERE name = 'Murang''a' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kandara', 'outskirts' FROM counties WHERE name = 'Murang''a' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Gatanga', 'outskirts' FROM counties WHERE name = 'Murang''a' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Maragua', 'outskirts' FROM counties WHERE name = 'Murang''a' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mathioya', 'outskirts' FROM counties WHERE name = 'Murang''a' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kangema', 'outskirts' FROM counties WHERE name = 'Murang''a' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Kiambu
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kiambu Town (CBD)', 'cbd' FROM counties WHERE name = 'Kiambu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Thika Town', 'cbd' FROM counties WHERE name = 'Kiambu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ruiru', 'outskirts' FROM counties WHERE name = 'Kiambu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kikuyu', 'outskirts' FROM counties WHERE name = 'Kiambu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Limuru', 'outskirts' FROM counties WHERE name = 'Kiambu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Juja', 'outskirts' FROM counties WHERE name = 'Kiambu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Githunguri', 'outskirts' FROM counties WHERE name = 'Kiambu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kabete', 'outskirts' FROM counties WHERE name = 'Kiambu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Lari', 'outskirts' FROM counties WHERE name = 'Kiambu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Turkana
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Lodwar (CBD)', 'cbd' FROM counties WHERE name = 'Turkana' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Turkana Central', 'outskirts' FROM counties WHERE name = 'Turkana' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Turkana West (Kakuma)', 'outskirts' FROM counties WHERE name = 'Turkana' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Turkana East', 'outskirts' FROM counties WHERE name = 'Turkana' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Turkana North', 'outskirts' FROM counties WHERE name = 'Turkana' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Turkana South', 'outskirts' FROM counties WHERE name = 'Turkana' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Loima', 'outskirts' FROM counties WHERE name = 'Turkana' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- West Pokot
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kapenguria (CBD)', 'cbd' FROM counties WHERE name = 'West Pokot' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Sigor', 'outskirts' FROM counties WHERE name = 'West Pokot' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kacheliba', 'outskirts' FROM counties WHERE name = 'West Pokot' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Pokot South', 'outskirts' FROM counties WHERE name = 'West Pokot' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Samburu
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Maralal (CBD)', 'cbd' FROM counties WHERE name = 'Samburu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Samburu West', 'outskirts' FROM counties WHERE name = 'Samburu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Samburu East', 'outskirts' FROM counties WHERE name = 'Samburu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Samburu North', 'outskirts' FROM counties WHERE name = 'Samburu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Trans-Nzoia
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kitale (CBD)', 'cbd' FROM counties WHERE name = 'Trans-Nzoia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kiminini', 'outskirts' FROM counties WHERE name = 'Trans-Nzoia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Saboti', 'outskirts' FROM counties WHERE name = 'Trans-Nzoia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Cherangany', 'outskirts' FROM counties WHERE name = 'Trans-Nzoia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Endebess', 'outskirts' FROM counties WHERE name = 'Trans-Nzoia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Uasin Gishu
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Eldoret CBD (Ainabkoi)', 'cbd' FROM counties WHERE name = 'Uasin Gishu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kapseret', 'outskirts' FROM counties WHERE name = 'Uasin Gishu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kesses', 'outskirts' FROM counties WHERE name = 'Uasin Gishu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Moiben', 'outskirts' FROM counties WHERE name = 'Uasin Gishu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Soy', 'outskirts' FROM counties WHERE name = 'Uasin Gishu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Turbo', 'outskirts' FROM counties WHERE name = 'Uasin Gishu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Elgeyo-Marakwet
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Iten (CBD)', 'cbd' FROM counties WHERE name = 'Elgeyo-Marakwet' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Keiyo North', 'outskirts' FROM counties WHERE name = 'Elgeyo-Marakwet' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Keiyo South', 'outskirts' FROM counties WHERE name = 'Elgeyo-Marakwet' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Marakwet East', 'outskirts' FROM counties WHERE name = 'Elgeyo-Marakwet' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Marakwet West', 'outskirts' FROM counties WHERE name = 'Elgeyo-Marakwet' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Nandi
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kapsabet (CBD)', 'cbd' FROM counties WHERE name = 'Nandi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nandi Hills', 'outskirts' FROM counties WHERE name = 'Nandi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Aldai', 'outskirts' FROM counties WHERE name = 'Nandi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Chesumei', 'outskirts' FROM counties WHERE name = 'Nandi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Emgwen', 'outskirts' FROM counties WHERE name = 'Nandi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mosop', 'outskirts' FROM counties WHERE name = 'Nandi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Baringo
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kabarnet (CBD)', 'cbd' FROM counties WHERE name = 'Baringo' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Baringo Central', 'outskirts' FROM counties WHERE name = 'Baringo' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Baringo North', 'outskirts' FROM counties WHERE name = 'Baringo' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Baringo South', 'outskirts' FROM counties WHERE name = 'Baringo' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Eldama Ravine', 'outskirts' FROM counties WHERE name = 'Baringo' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mogotio', 'outskirts' FROM counties WHERE name = 'Baringo' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Tiaty', 'outskirts' FROM counties WHERE name = 'Baringo' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Laikipia
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nanyuki (CBD)', 'cbd' FROM counties WHERE name = 'Laikipia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nyahururu', 'outskirts' FROM counties WHERE name = 'Laikipia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Laikipia East', 'outskirts' FROM counties WHERE name = 'Laikipia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Laikipia West', 'outskirts' FROM counties WHERE name = 'Laikipia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Laikipia North', 'outskirts' FROM counties WHERE name = 'Laikipia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Nakuru
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nakuru Town East (CBD)', 'cbd' FROM counties WHERE name = 'Nakuru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nakuru Town West', 'cbd' FROM counties WHERE name = 'Nakuru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Naivasha', 'outskirts' FROM counties WHERE name = 'Nakuru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Gilgil', 'outskirts' FROM counties WHERE name = 'Nakuru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Molo', 'outskirts' FROM counties WHERE name = 'Nakuru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Njoro', 'outskirts' FROM counties WHERE name = 'Nakuru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Rongai', 'outskirts' FROM counties WHERE name = 'Nakuru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Subukia', 'outskirts' FROM counties WHERE name = 'Nakuru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Bahati', 'outskirts' FROM counties WHERE name = 'Nakuru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kuresoi North', 'outskirts' FROM counties WHERE name = 'Nakuru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kuresoi South', 'outskirts' FROM counties WHERE name = 'Nakuru' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Narok
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Narok Town (CBD)', 'cbd' FROM counties WHERE name = 'Narok' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Narok North', 'outskirts' FROM counties WHERE name = 'Narok' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Narok South', 'outskirts' FROM counties WHERE name = 'Narok' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Narok East', 'outskirts' FROM counties WHERE name = 'Narok' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Narok West', 'outskirts' FROM counties WHERE name = 'Narok' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kilgoris', 'outskirts' FROM counties WHERE name = 'Narok' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Emurua Dikirr', 'outskirts' FROM counties WHERE name = 'Narok' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Kajiado
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kajiado Central (CBD)', 'cbd' FROM counties WHERE name = 'Kajiado' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kitengela', 'outskirts' FROM counties WHERE name = 'Kajiado' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ngong', 'outskirts' FROM counties WHERE name = 'Kajiado' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ongata Rongai', 'outskirts' FROM counties WHERE name = 'Kajiado' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kajiado North', 'outskirts' FROM counties WHERE name = 'Kajiado' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kajiado East', 'outskirts' FROM counties WHERE name = 'Kajiado' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kajiado West', 'outskirts' FROM counties WHERE name = 'Kajiado' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kajiado South', 'outskirts' FROM counties WHERE name = 'Kajiado' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Kericho
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kericho Town (CBD)', 'cbd' FROM counties WHERE name = 'Kericho' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ainamoi', 'outskirts' FROM counties WHERE name = 'Kericho' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Belgut', 'outskirts' FROM counties WHERE name = 'Kericho' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Bureti', 'outskirts' FROM counties WHERE name = 'Kericho' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kipkelion East', 'outskirts' FROM counties WHERE name = 'Kericho' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kipkelion West', 'outskirts' FROM counties WHERE name = 'Kericho' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Soin/Sigowet', 'outskirts' FROM counties WHERE name = 'Kericho' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Bomet
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Bomet Central (CBD)', 'cbd' FROM counties WHERE name = 'Bomet' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Bomet East', 'outskirts' FROM counties WHERE name = 'Bomet' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Chepalungu', 'outskirts' FROM counties WHERE name = 'Bomet' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Konoin', 'outskirts' FROM counties WHERE name = 'Bomet' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Sotik', 'outskirts' FROM counties WHERE name = 'Bomet' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Kakamega
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kakamega Town (Lurambi CBD)', 'cbd' FROM counties WHERE name = 'Kakamega' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mumias East', 'outskirts' FROM counties WHERE name = 'Kakamega' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mumias West', 'outskirts' FROM counties WHERE name = 'Kakamega' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Malava', 'outskirts' FROM counties WHERE name = 'Kakamega' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Shinyalu', 'outskirts' FROM counties WHERE name = 'Kakamega' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ikolomani', 'outskirts' FROM counties WHERE name = 'Kakamega' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Butere', 'outskirts' FROM counties WHERE name = 'Kakamega' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Khwisero', 'outskirts' FROM counties WHERE name = 'Kakamega' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Matungu', 'outskirts' FROM counties WHERE name = 'Kakamega' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Navakholo', 'outskirts' FROM counties WHERE name = 'Kakamega' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Likuyani', 'outskirts' FROM counties WHERE name = 'Kakamega' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Lugari', 'outskirts' FROM counties WHERE name = 'Kakamega' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Vihiga
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mbale (CBD)', 'cbd' FROM counties WHERE name = 'Vihiga' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Vihiga', 'outskirts' FROM counties WHERE name = 'Vihiga' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Sabatia', 'outskirts' FROM counties WHERE name = 'Vihiga' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Hamisi', 'outskirts' FROM counties WHERE name = 'Vihiga' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Luanda', 'outskirts' FROM counties WHERE name = 'Vihiga' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Emuhaya', 'outskirts' FROM counties WHERE name = 'Vihiga' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Bungoma
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Bungoma Town (Kanduyi CBD)', 'cbd' FROM counties WHERE name = 'Bungoma' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Webuye East', 'outskirts' FROM counties WHERE name = 'Bungoma' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Webuye West', 'outskirts' FROM counties WHERE name = 'Bungoma' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kimilili', 'outskirts' FROM counties WHERE name = 'Bungoma' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Sirisia', 'outskirts' FROM counties WHERE name = 'Bungoma' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Tongaren', 'outskirts' FROM counties WHERE name = 'Bungoma' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Bumula', 'outskirts' FROM counties WHERE name = 'Bungoma' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mt. Elgon', 'outskirts' FROM counties WHERE name = 'Bungoma' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kabuchai', 'outskirts' FROM counties WHERE name = 'Bungoma' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Busia
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Busia Town (Matayos CBD)', 'cbd' FROM counties WHERE name = 'Busia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Teso North', 'outskirts' FROM counties WHERE name = 'Busia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Teso South', 'outskirts' FROM counties WHERE name = 'Busia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nambale', 'outskirts' FROM counties WHERE name = 'Busia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Butula', 'outskirts' FROM counties WHERE name = 'Busia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Funyula (Samia)', 'outskirts' FROM counties WHERE name = 'Busia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Budalangi (Bunyala)', 'outskirts' FROM counties WHERE name = 'Busia' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Siaya
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Siaya Town (Alego Usonga CBD)', 'cbd' FROM counties WHERE name = 'Siaya' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Bondo', 'outskirts' FROM counties WHERE name = 'Siaya' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Rarieda', 'outskirts' FROM counties WHERE name = 'Siaya' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Gem', 'outskirts' FROM counties WHERE name = 'Siaya' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ugenya', 'outskirts' FROM counties WHERE name = 'Siaya' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ugunja', 'outskirts' FROM counties WHERE name = 'Siaya' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Kisumu
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kisumu Central (CBD)', 'cbd' FROM counties WHERE name = 'Kisumu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kisumu East', 'outskirts' FROM counties WHERE name = 'Kisumu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kisumu West', 'outskirts' FROM counties WHERE name = 'Kisumu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nyakach', 'outskirts' FROM counties WHERE name = 'Kisumu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nyando', 'outskirts' FROM counties WHERE name = 'Kisumu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Muhoroni', 'outskirts' FROM counties WHERE name = 'Kisumu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Seme', 'outskirts' FROM counties WHERE name = 'Kisumu' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Homa Bay
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Homa Bay Town (CBD)', 'cbd' FROM counties WHERE name = 'Homa Bay' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mbita (Suba North)', 'outskirts' FROM counties WHERE name = 'Homa Bay' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Suba South', 'outskirts' FROM counties WHERE name = 'Homa Bay' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ndhiwa', 'outskirts' FROM counties WHERE name = 'Homa Bay' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Rangwe', 'outskirts' FROM counties WHERE name = 'Homa Bay' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Karachuonyo', 'outskirts' FROM counties WHERE name = 'Homa Bay' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kabondo Kasipul', 'outskirts' FROM counties WHERE name = 'Homa Bay' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kasipul', 'outskirts' FROM counties WHERE name = 'Homa Bay' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Migori
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Migori Town (Suna West CBD)', 'cbd' FROM counties WHERE name = 'Migori' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Suna East', 'outskirts' FROM counties WHERE name = 'Migori' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Rongo', 'outskirts' FROM counties WHERE name = 'Migori' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Awendo', 'outskirts' FROM counties WHERE name = 'Migori' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Uriri', 'outskirts' FROM counties WHERE name = 'Migori' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nyatike', 'outskirts' FROM counties WHERE name = 'Migori' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kuria West', 'outskirts' FROM counties WHERE name = 'Migori' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kuria East', 'outskirts' FROM counties WHERE name = 'Migori' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Kisii
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kisii Central (CBD)', 'cbd' FROM counties WHERE name = 'Kisii' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kitutu Chache North', 'outskirts' FROM counties WHERE name = 'Kisii' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kitutu Chache South', 'outskirts' FROM counties WHERE name = 'Kisii' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nyaribari Chache', 'outskirts' FROM counties WHERE name = 'Kisii' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nyaribari Masaba', 'outskirts' FROM counties WHERE name = 'Kisii' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Bobasi', 'outskirts' FROM counties WHERE name = 'Kisii' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Bomachoge Borabu', 'outskirts' FROM counties WHERE name = 'Kisii' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Bomachoge Chache', 'outskirts' FROM counties WHERE name = 'Kisii' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'South Mugirango', 'outskirts' FROM counties WHERE name = 'Kisii' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Bonchari', 'outskirts' FROM counties WHERE name = 'Kisii' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Nyamira
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Nyamira Town (CBD)', 'cbd' FROM counties WHERE name = 'Nyamira' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Borabu', 'outskirts' FROM counties WHERE name = 'Nyamira' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Manga', 'outskirts' FROM counties WHERE name = 'Nyamira' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Masaba North', 'outskirts' FROM counties WHERE name = 'Nyamira' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'West Mugirango', 'outskirts' FROM counties WHERE name = 'Nyamira' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
-- Nairobi
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'CBD (Starehe)', 'cbd' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Westlands', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kilimani / Dagoretti', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Lang''ata / Karen', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Embakasi Central', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Embakasi East', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Embakasi West', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Embakasi North', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Embakasi South', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kasarani', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Ruaraka', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Roysambu', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kamukunji', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Makadara', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Kibra', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
INSERT INTO sub_counties (county_id, name, zone) SELECT id, 'Mathare', 'outskirts' FROM counties WHERE name = 'Nairobi' ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone;
