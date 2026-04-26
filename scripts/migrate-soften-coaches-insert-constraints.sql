-- SportsMatch: harden coaches insert path against legacy NOT NULL mismatches
-- Safe migration style: keep data, add defaults, relax nullable constraints
-- for non-core fields that should not block coach application submission.

BEGIN;

-- Experience and legacy pricing
ALTER TABLE coaches ALTER COLUMN experience_level DROP NOT NULL;
ALTER TABLE coaches ALTER COLUMN experience_level SET DEFAULT '';
UPDATE coaches SET experience_level = COALESCE(experience_level, '') WHERE experience_level IS NULL;

ALTER TABLE coaches ALTER COLUMN trial_price DROP NOT NULL;
ALTER TABLE coaches ALTER COLUMN regular_price DROP NOT NULL;
ALTER TABLE coaches ALTER COLUMN trial_price SET DEFAULT 0;
ALTER TABLE coaches ALTER COLUMN regular_price SET DEFAULT 0;
UPDATE coaches
SET
  trial_price = COALESCE(trial_price, 0),
  regular_price = COALESCE(regular_price, 0)
WHERE trial_price IS NULL OR regular_price IS NULL;

-- Arrays used by profile/edit flows
ALTER TABLE coaches ALTER COLUMN age_groups DROP NOT NULL;
ALTER TABLE coaches ALTER COLUMN teaching_focus DROP NOT NULL;
ALTER TABLE coaches ALTER COLUMN age_groups SET DEFAULT '{}'::text[];
ALTER TABLE coaches ALTER COLUMN teaching_focus SET DEFAULT '{}'::text[];
UPDATE coaches SET age_groups = '{}'::text[] WHERE age_groups IS NULL;
UPDATE coaches SET teaching_focus = '{}'::text[] WHERE teaching_focus IS NULL;

-- Verification/status booleans
ALTER TABLE coaches ALTER COLUMN is_professional_athlete_verified DROP NOT NULL;
ALTER TABLE coaches ALTER COLUMN is_licensed_coach_verified DROP NOT NULL;
ALTER TABLE coaches ALTER COLUMN is_featured DROP NOT NULL;
ALTER TABLE coaches ALTER COLUMN is_approved DROP NOT NULL;
ALTER TABLE coaches ALTER COLUMN is_rejected DROP NOT NULL;

ALTER TABLE coaches ALTER COLUMN is_professional_athlete_verified SET DEFAULT false;
ALTER TABLE coaches ALTER COLUMN is_licensed_coach_verified SET DEFAULT false;
ALTER TABLE coaches ALTER COLUMN is_featured SET DEFAULT false;
ALTER TABLE coaches ALTER COLUMN is_approved SET DEFAULT false;
ALTER TABLE coaches ALTER COLUMN is_rejected SET DEFAULT false;

UPDATE coaches SET is_professional_athlete_verified = COALESCE(is_professional_athlete_verified, false) WHERE is_professional_athlete_verified IS NULL;
UPDATE coaches SET is_licensed_coach_verified = COALESCE(is_licensed_coach_verified, false) WHERE is_licensed_coach_verified IS NULL;
UPDATE coaches SET is_featured = COALESCE(is_featured, false) WHERE is_featured IS NULL;
UPDATE coaches SET is_approved = COALESCE(is_approved, false) WHERE is_approved IS NULL;
UPDATE coaches SET is_rejected = COALESCE(is_rejected, false) WHERE is_rejected IS NULL;

COMMIT;

-- Verify key columns used during coach submission
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name IN (
    'experience_level',
    'trial_price',
    'regular_price',
    'age_groups',
    'teaching_focus',
    'is_professional_athlete_verified',
    'is_licensed_coach_verified',
    'is_featured',
    'is_approved',
    'is_rejected'
  )
ORDER BY column_name;
