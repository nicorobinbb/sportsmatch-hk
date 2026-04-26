-- SportsMatch Phase 2: remove legacy pricing columns
-- Run this only after code no longer depends on coaches.trial_price / coaches.regular_price.

BEGIN;

ALTER TABLE coaches DROP COLUMN IF EXISTS trial_price;
ALTER TABLE coaches DROP COLUMN IF EXISTS regular_price;

COMMIT;

-- Verify removal
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name IN ('trial_price', 'regular_price', 'pricing_plans')
ORDER BY column_name;
