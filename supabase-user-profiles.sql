-- Create user_profiles table for role-based access (admin vs tech)
-- Techs cannot see financial data (prices, invoices, revenue)

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'tech' CHECK (role IN ('admin', 'tech')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles (for future team management)
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert new profiles
CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update any profile
CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ⚠️ IMPORTANT: After running this SQL, run the following line separately,
-- replacing YOUR-USER-ID with your actual Supabase user UUID
-- (find it in Supabase Dashboard → Authentication → Users):
--
-- INSERT INTO user_profiles (id, role) VALUES ('YOUR-USER-ID-HERE', 'admin');
