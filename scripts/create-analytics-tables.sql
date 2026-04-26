-- Create coach_stats table for aggregate stats
CREATE TABLE IF NOT EXISTS coach_stats (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  total_profile_views INTEGER NOT NULL DEFAULT 0,
  total_contact_unlocks INTEGER NOT NULL DEFAULT 0,
  total_revenue INTEGER NOT NULL DEFAULT 0, -- in HKD cents
  total_wishlist_saves INTEGER NOT NULL DEFAULT 0,
  unlock_price INTEGER NOT NULL DEFAULT 3000, -- default $30.00 in cents
  unlock_price_enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(coach_id)
);

-- Create coach_analytics table for daily analytics
CREATE TABLE IF NOT EXISTS coach_analytics (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  profile_views INTEGER NOT NULL DEFAULT 0,
  contact_unlocks INTEGER NOT NULL DEFAULT 0,
  unlock_revenue INTEGER NOT NULL DEFAULT 0, -- in HKD cents
  wishlist_adds INTEGER NOT NULL DEFAULT 0,
  wishlist_removes INTEGER NOT NULL DEFAULT 0,
  phone_clicks INTEGER NOT NULL DEFAULT 0,
  whatsapp_clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(coach_id, date)
);

-- Enable RLS
ALTER TABLE coach_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_analytics ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_coach_stats_coach_id ON coach_stats(coach_id);
CREATE INDEX idx_coach_analytics_coach_id ON coach_analytics(coach_id);
CREATE INDEX idx_coach_analytics_date ON coach_analytics(date);

-- Policy: Coaches can view their own stats
CREATE POLICY "Coaches can view own stats"
  ON coach_stats FOR SELECT
  USING (coach_id IN (
    SELECT id FROM coaches WHERE user_id = auth.uid()
  ));

-- Policy: Coaches can update their own unlock price
CREATE POLICY "Coaches can update own unlock price"
  ON coach_stats FOR UPDATE
  USING (coach_id IN (
    SELECT id FROM coaches WHERE user_id = auth.uid()
  ));

-- Policy: Coaches can view their own analytics
CREATE POLICY "Coaches can view own analytics"
  ON coach_analytics FOR SELECT
  USING (coach_id IN (
    SELECT id FROM coaches WHERE user_id = auth.uid()
  ));
