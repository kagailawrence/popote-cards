-- Migration 012: Comprehensive Performance Indexing for all Tables, FKs, Composite Filters, and Sort Paths

-- 1. Orders & Audit Timeline Indexes
CREATE INDEX IF NOT EXISTS idx_orders_placed_by_admin ON orders(placed_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_created_at ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_timeline ON order_status_logs(order_id, created_at ASC);

-- 2. Order Items Foreign Key & Status Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_design_id ON order_items(design_id);
CREATE INDEX IF NOT EXISTS idx_order_items_county_id ON order_items(county_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sub_county_id ON order_items(sub_county_id);
CREATE INDEX IF NOT EXISTS idx_county_print_regions_region_id ON county_print_regions(print_region_id);

-- 3. Catalog & Design Filtering / Sorting Indexes
CREATE INDEX IF NOT EXISTS idx_designs_active_created_at ON designs(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_card_type ON designs(card_type);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- 4. Payments & Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_mpesa_transactions_status ON mpesa_transactions(status);
CREATE INDEX IF NOT EXISTS idx_mpesa_transactions_created_at ON mpesa_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mpesa_transactions_phone ON mpesa_transactions(phone);

-- 5. Deliveries, Riders & Disputes Indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_refund_status ON disputes(refund_status);

-- 6. Inventory & Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_logs_order_id ON inventory_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at DESC);

-- 7. Reviews Performance Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_approved_created_at ON reviews(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_approved_rating ON reviews(is_approved, rating DESC, created_at DESC);

-- 8. Auth Token Quick Lookup Index (Partial for active non-revoked tokens)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON refresh_tokens(token_hash) WHERE revoked = false;
