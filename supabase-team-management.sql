-- Team Management: Add email/display_name to user_profiles + DELETE policy
-- Run this in Supabase SQL Editor

-- Add email and display_name columns (auto-populated from auth session on login)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Index on email for display
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Allow admins to delete profiles (for team member removal)
CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
