-- Migration: Remove trial_price and regular_price from coaches table
-- Since you're now using pricing_plans JSON instead

-- Option 1: Make columns nullable (recommended - keeps historical data)
ALTER TABLE coaches ALTER COLUMN trial_price DROP NOT NULL;
ALTER TABLE coaches ALTER COLUMN regular_price DROP NOT NULL;

-- Option 2: Set default to 0
ALTER TABLE coaches ALTER COLUMN trial_price SET DEFAULT 0;
ALTER TABLE coaches ALTER COLUMN regular_price SET DEFAULT 0;

-- Update existing records to have 0 instead of old values
-- (if you want to clear old pricing data)
-- UPDATE coaches SET trial_price = 0, regular_price = 0;

-- Verify the changes
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'coaches' 
AND column_name IN ('trial_price', 'regular_price', 'pricing_plans');
