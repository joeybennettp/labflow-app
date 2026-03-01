-- ============================================
-- LabFlow Database Schema
-- Full current-state schema for all tables,
-- functions, triggers, and indexes.
-- ============================================

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Auto-update "updated_at" timestamp (used by cases)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update "updated_at" timestamp (used by lab_settings, materials)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if a user is lab staff (admin or tech) — bypasses RLS
CREATE OR REPLACE FUNCTION is_lab_staff(user_id UUID)
RETURNS BOOLEAN
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

-- Check if a user is admin — bypasses RLS (prevents infinite recursion on user_profiles)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = user_id AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Get the doctor record ID for the current auth user
CREATE OR REPLACE FUNCTION get_doctor_id_for_user()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM doctors WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Auto-generate case numbers (C-XXXX)
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM 3) AS INTEGER)), 4570) + 1
  INTO next_num
  FROM cases;
  NEW.case_number := 'C-' || next_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLES
-- ============================================

-- Doctors (dentist clients)
CREATE TABLE doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  practice TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  auth_user_id UUID REFERENCES auth.users(id) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cases (lab orders)
CREATE TABLE cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  patient TEXT NOT NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  shade TEXT DEFAULT 'A2',
  status TEXT DEFAULT 'received' CHECK (status IN (
    'received', 'in_progress', 'quality_check', 'ready', 'shipped'
  )),
  rush BOOLEAN DEFAULT FALSE,
  due DATE NOT NULL,
  price NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  invoiced BOOLEAN DEFAULT FALSE,
  shipping_carrier TEXT DEFAULT '',
  tracking_number TEXT DEFAULT '',
  shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_case_number
  BEFORE INSERT ON cases
  FOR EACH ROW
  WHEN (NEW.case_number IS NULL OR NEW.case_number = '')
  EXECUTE FUNCTION generate_case_number();

CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- User profiles (role-based access for lab staff)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'tech' CHECK (role IN ('admin', 'tech', 'doctor')),
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Lab settings
CREATE TABLE lab_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_name TEXT NOT NULL DEFAULT 'My Dental Lab',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  zip TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_lab_settings_updated_at
  BEFORE UPDATE ON lab_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Case attachments (file uploads)
CREATE TABLE case_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_by_role TEXT NOT NULL DEFAULT 'lab',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_case_attachments_case_id ON case_attachments(case_id);

-- Case messages (per-case messaging between lab and doctors)
CREATE TABLE case_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('lab', 'doctor')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_case_messages_case_id ON case_messages(case_id);

-- Materials (inventory)
CREATE TABLE materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT DEFAULT '',
  category TEXT DEFAULT '',
  quantity NUMERIC(10,2) DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  reorder_level NUMERIC(10,2) DEFAULT 0,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  supplier TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Case-materials junction (material usage per case)
CREATE TABLE case_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  quantity_used NUMERIC(10,2) DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log (audit trail)
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL DEFAULT 'Unknown',
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_case_id ON activity_log(case_id);

-- Team invites
CREATE TABLE team_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'tech' CHECK (role IN ('admin', 'tech')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_team_invites_pending_email
  ON team_invites(LOWER(email))
  WHERE status = 'pending';

-- ============================================
-- RPC FUNCTIONS (Doctor Portal)
-- ============================================

-- Pre-check: does this email belong to an unlinked doctor?
CREATE OR REPLACE FUNCTION check_doctor_email(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM doctors
    WHERE LOWER(email) = LOWER(check_email)
    AND auth_user_id IS NULL
  );
END;
$$;

-- Post-signup: link auth user to doctor record, create user_profile
CREATE OR REPLACE FUNCTION link_doctor_account(p_user_id UUID, p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  SELECT id INTO v_doctor_id
  FROM doctors
  WHERE LOWER(email) = LOWER(p_email)
  AND auth_user_id IS NULL
  LIMIT 1;

  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'No matching doctor record found for this email.';
  END IF;

  UPDATE doctors SET auth_user_id = p_user_id WHERE id = v_doctor_id;

  INSERT INTO user_profiles (id, role, email)
  VALUES (p_user_id, 'doctor', p_email)
  ON CONFLICT (id) DO UPDATE SET role = 'doctor', email = p_email;

  RETURN v_doctor_id;
END;
$$;

-- ============================================
-- RPC FUNCTIONS (Team Invites)
-- ============================================

-- Admin-only: create an invite with validation
CREATE OR REPLACE FUNCTION create_team_invite(p_email TEXT, p_role TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id UUID;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can create invites.';
  END IF;

  IF p_role NOT IN ('admin', 'tech') THEN
    RAISE EXCEPTION 'Role must be admin or tech.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE LOWER(email) = LOWER(p_email)
  ) THEN
    RAISE EXCEPTION 'A user with this email already exists.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM team_invites
    WHERE LOWER(email) = LOWER(p_email)
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A pending invite already exists for this email.';
  END IF;

  INSERT INTO team_invites (email, role, invited_by)
  VALUES (LOWER(p_email), p_role, auth.uid())
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$;

-- Public: check if a pending invite exists for an email
CREATE OR REPLACE FUNCTION check_team_invite(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_invites
    WHERE LOWER(email) = LOWER(check_email)
    AND status = 'pending'
  );
END;
$$;

-- Post-signup: claim invite, create user_profile, mark as claimed
CREATE OR REPLACE FUNCTION claim_team_invite(p_user_id UUID, p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM team_invites
  WHERE LOWER(email) = LOWER(p_email)
  AND status = 'pending'
  LIMIT 1;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'No pending invite found for this email.';
  END IF;

  INSERT INTO user_profiles (id, role, email)
  VALUES (p_user_id, v_role, LOWER(p_email))
  ON CONFLICT (id) DO UPDATE SET role = v_role, email = LOWER(p_email);

  UPDATE team_invites
  SET status = 'claimed', claimed_at = NOW()
  WHERE LOWER(email) = LOWER(p_email)
  AND status = 'pending';

  RETURN v_role;
END;
$$;
