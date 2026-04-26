-- SportsMatch: soften legacy experience_level constraint
-- Goal: prevent coach submission failures when experience_level is omitted.

BEGIN;

-- Keep historical data; only relax strict write requirement.
ALTER TABLE coaches ALTER COLUMN experience_level DROP NOT NULL;
ALTER TABLE coaches ALTER COLUMN experience_level SET DEFAULT '';

-- Backfill any nullable rows (future-proof if imports created nulls).
UPDATE coaches
SET experience_level = COALESCE(experience_level, '')
WHERE experience_level IS NULL;

COMMIT;

-- Verify
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name = 'experience_level';
