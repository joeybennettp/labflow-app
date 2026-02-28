-- ============================================
-- Doctor Portal: Database Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add auth_user_id column to doctors table
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) UNIQUE;

-- 2. Helper function: check if a user is lab staff (admin or tech)
CREATE OR REPLACE FUNCTION is_lab_staff(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role IN ('admin', 'tech')
  );
$$;

-- 3. Helper function: get the doctor record ID for the current auth user
CREATE OR REPLACE FUNCTION get_doctor_id_for_user()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM doctors WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- 4. Registration pre-check: does this email belong to an unlinked doctor?
CREATE OR REPLACE FUNCTION check_doctor_email(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM doctors
    WHERE lower(email) = lower(check_email)
    AND auth_user_id IS NULL
  );
END;
$$;

-- 5. Post-signup: link auth user to doctor record, create user_profile
CREATE OR REPLACE FUNCTION link_doctor_account(p_user_id uuid, p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_id uuid;
BEGIN
  -- Find the matching unlinked doctor
  SELECT id INTO v_doctor_id
  FROM doctors
  WHERE lower(email) = lower(p_email)
  AND auth_user_id IS NULL
  LIMIT 1;

  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'No matching doctor record found for this email.';
  END IF;

  -- Link auth user to doctor
  UPDATE doctors SET auth_user_id = p_user_id WHERE id = v_doctor_id;

  -- Create user_profiles entry with doctor role
  INSERT INTO user_profiles (id, role, email)
  VALUES (p_user_id, 'doctor', p_email)
  ON CONFLICT (id) DO UPDATE SET role = 'doctor', email = p_email;

  RETURN v_doctor_id;
END;
$$;

-- ============================================
-- 6. Replace blanket RLS policies on CASES
-- ============================================

-- Drop existing blanket policies
DROP POLICY IF EXISTS "Authenticated read cases" ON cases;
DROP POLICY IF EXISTS "Authenticated insert cases" ON cases;
DROP POLICY IF EXISTS "Authenticated update cases" ON cases;
DROP POLICY IF EXISTS "Authenticated delete cases" ON cases;

-- Lab staff (admin/tech) can see all cases
CREATE POLICY "Lab staff can view all cases"
  ON cases FOR SELECT
  TO authenticated
  USING (is_lab_staff(auth.uid()));

-- Doctors can only see their own cases
CREATE POLICY "Doctors can view own cases"
  ON cases FOR SELECT
  TO authenticated
  USING (doctor_id = get_doctor_id_for_user());

-- Only lab staff can insert/update/delete cases
CREATE POLICY "Lab staff can insert cases"
  ON cases FOR INSERT
  TO authenticated
  WITH CHECK (is_lab_staff(auth.uid()));

CREATE POLICY "Lab staff can update cases"
  ON cases FOR UPDATE
  TO authenticated
  USING (is_lab_staff(auth.uid()));

CREATE POLICY "Lab staff can delete cases"
  ON cases FOR DELETE
  TO authenticated
  USING (is_lab_staff(auth.uid()));

-- ============================================
-- 7. Replace blanket RLS policies on DOCTORS
-- ============================================

-- Drop existing blanket policies
DROP POLICY IF EXISTS "Authenticated read doctors" ON doctors;
DROP POLICY IF EXISTS "Authenticated insert doctors" ON doctors;
DROP POLICY IF EXISTS "Authenticated update doctors" ON doctors;
DROP POLICY IF EXISTS "Authenticated delete doctors" ON doctors;

-- Lab staff can see all doctors
CREATE POLICY "Lab staff can view all doctors"
  ON doctors FOR SELECT
  TO authenticated
  USING (is_lab_staff(auth.uid()));

-- Doctors can see only their own record
CREATE POLICY "Doctors can view own record"
  ON doctors FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Only lab staff can insert/update/delete doctors
CREATE POLICY "Lab staff can insert doctors"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (is_lab_staff(auth.uid()));

CREATE POLICY "Lab staff can update doctors"
  ON doctors FOR UPDATE
  TO authenticated
  USING (is_lab_staff(auth.uid()));

CREATE POLICY "Lab staff can delete doctors"
  ON doctors FOR DELETE
  TO authenticated
  USING (is_lab_staff(auth.uid()));
