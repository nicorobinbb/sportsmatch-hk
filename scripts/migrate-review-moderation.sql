ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_removed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS removed_reason text,
ADD COLUMN IF NOT EXISTS removed_at timestamptz,
ADD COLUMN IF NOT EXISTS removed_by text;

UPDATE reviews
SET is_approved = true
WHERE is_approved = false;
