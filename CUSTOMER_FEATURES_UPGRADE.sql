-- Customer Features Upgrade: website field + audio attachment support
-- Run this in your Supabase SQL Editor after the main schema is installed.

-- 1. Add website URL column to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS website TEXT;

-- 2. Index for website search (optional but useful)
CREATE INDEX IF NOT EXISTS idx_customers_website ON customers(website) WHERE website IS NOT NULL;

-- Note: Run customer-audio-storage-setup.sql separately to create the private audio bucket.
