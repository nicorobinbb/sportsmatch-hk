ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS is_professional_athlete_verified boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_licensed_coach_verified boolean NOT NULL DEFAULT false;

UPDATE coaches
SET
  is_professional_athlete_verified = (
    COALESCE(experience_level, '') ILIKE '%專業運動員%'
    OR COALESCE(experience_level, '') ILIKE '%職業運動員%'
    OR COALESCE(experience_level, '') ILIKE '%職業%'
  ),
  is_licensed_coach_verified = (
    COALESCE(experience_level, '') ILIKE '%持牌教練%'
    OR COALESCE(experience_level, '') ILIKE '%教練牌照%'
  )
WHERE is_professional_athlete_verified = false
  AND is_licensed_coach_verified = false;
