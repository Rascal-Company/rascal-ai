-- Migration: Add saved_searches table for saving lead search queries
-- Feature 3: Save searches

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  query TEXT NOT NULL,
  location VARCHAR(100),
  headcount INTEGER,
  ownership VARCHAR(50),
  intent_to_sell BOOLEAN DEFAULT false,
  filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own searches" ON saved_searches
  FOR SELECT USING (auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = user_id
    UNION
    SELECT auth_user_id FROM org_members WHERE org_id = user_id
  ));

CREATE POLICY "Users can insert own searches" ON saved_searches
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = user_id
    UNION
    SELECT auth_user_id FROM org_members WHERE org_id = user_id
  ));

CREATE POLICY "Users can update own searches" ON saved_searches
  FOR UPDATE USING (auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = user_id
    UNION
    SELECT auth_user_id FROM org_members WHERE org_id = user_id
  ));

CREATE POLICY "Users can delete own searches" ON saved_searches
  FOR DELETE USING (auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = user_id
    UNION
    SELECT auth_user_id FROM org_members WHERE org_id = user_id
  ));
