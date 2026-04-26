ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS reply_comment text,
ADD COLUMN IF NOT EXISTS reply_at timestamptz,
ADD COLUMN IF NOT EXISTS reply_by text;
