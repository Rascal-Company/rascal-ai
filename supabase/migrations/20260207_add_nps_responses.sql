-- Migration: Add nps_responses table for monthly NPS surveys

CREATE TABLE nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback TEXT,
  category TEXT NOT NULL CHECK (category IN ('promoter', 'passive', 'detractor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookup of latest response per user
CREATE INDEX idx_nps_responses_user_created ON nps_responses(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own responses
CREATE POLICY "Users can insert own responses" ON nps_responses
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = user_id
    UNION
    SELECT auth_user_id FROM org_members WHERE org_id = user_id
  ));

-- Policy: Users can read their own responses
CREATE POLICY "Users can read own responses" ON nps_responses
  FOR SELECT USING (auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = user_id
    UNION
    SELECT auth_user_id FROM org_members WHERE org_id = user_id
  ));
