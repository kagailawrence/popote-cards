-- Migration 013: Password Resets and Customer Account Security

-- 1. Extend customers table with full_name, password_hash, is_active, updated_at
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- 2. Password Reset Tokens Table for Secure Token-based Recovery
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  user_type TEXT NOT NULL DEFAULT 'customer' CHECK (user_type IN ('customer', 'admin')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_reset_tokens(expires_at);
