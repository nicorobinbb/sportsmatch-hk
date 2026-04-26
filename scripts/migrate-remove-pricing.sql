-- SportsMatch pricing legacy cleanup (safe, phased)
-- Phase 1 (run now): keep columns but remove hard dependency
-- - Drop NOT NULL
-- - Set DEFAULT 0
-- - Backfill NULL to 0
--
-- Phase 2 (run later, only after confirming no code references remain):
-- - Drop columns trial_price / regular_price

BEGIN;

ALTER TABLE coaches ALTER COLUMN trial_price DROP NOT NULL;
ALTER TABLE coaches ALTER COLUMN regular_price DROP NOT NULL;

ALTER TABLE coaches ALTER COLUMN trial_price SET DEFAULT 0;
ALTER TABLE coaches ALTER COLUMN regular_price SET DEFAULT 0;

UPDATE coaches
SET
  trial_price = COALESCE(trial_price, 0),
  regular_price = COALESCE(regular_price, 0)
WHERE trial_price IS NULL OR regular_price IS NULL;

COMMIT;

-- Verify Phase 1 result
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name IN ('trial_price', 'regular_price', 'pricing_plans')
ORDER BY column_name;

-- -------------------------------
-- Phase 2 (manual, later)
-- -------------------------------
-- ALTER TABLE coaches DROP COLUMN IF EXISTS trial_price;
-- ALTER TABLE coaches DROP COLUMN IF EXISTS regular_price;

-- -------------------------------
-- Rollback for Phase 1 (if needed)
-- -------------------------------
-- ALTER TABLE coaches ALTER COLUMN trial_price DROP DEFAULT;
-- ALTER TABLE coaches ALTER COLUMN regular_price DROP DEFAULT;
-- UPDATE coaches SET trial_price = 0, regular_price = 0
-- WHERE trial_price IS NULL OR regular_price IS NULL;
-- ALTER TABLE coaches ALTER COLUMN trial_price SET NOT NULL;
-- ALTER TABLE coaches ALTER COLUMN regular_price SET NOT NULL;
