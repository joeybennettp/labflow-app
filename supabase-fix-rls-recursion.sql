-- Fix infinite recursion in user_profiles RLS policies
-- The admin policies query user_profiles to check role, which triggers the same
-- policies again. Fix: use a SECURITY DEFINER function that bypasses RLS.

-- 1. Create a function that checks admin status WITHOUT going through RLS
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = user_id AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Drop the problematic self-referencing policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

-- 3. Recreate policies using the function (no more recursion)
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE
  USING (is_admin(auth.uid()));
