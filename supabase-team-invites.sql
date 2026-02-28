-- ============================================
-- Team Invites: Database Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create the team_invites table
CREATE TABLE team_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'tech' CHECK (role IN ('admin', 'tech')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ
);

-- Prevent duplicate pending invites for the same email
CREATE UNIQUE INDEX idx_team_invites_pending_email
  ON team_invites(lower(email))
  WHERE status = 'pending';

ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- 2. RLS: Admins can read all invites
CREATE POLICY "Admins can read invites"
  ON team_invites FOR SELECT
  USING (is_admin(auth.uid()));

-- 3. RLS: Admins can insert invites
CREATE POLICY "Admins can insert invites"
  ON team_invites FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- 4. RLS: Admins can update invites (for revoking)
CREATE POLICY "Admins can update invites"
  ON team_invites FOR UPDATE
  USING (is_admin(auth.uid()));

-- ============================================
-- RPC Functions (SECURITY DEFINER)
-- ============================================

-- 5. Admin-only: Create an invite with validation
CREATE OR REPLACE FUNCTION create_team_invite(p_email TEXT, p_role TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id UUID;
BEGIN
  -- Verify caller is an admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can create invites.';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'tech') THEN
    RAISE EXCEPTION 'Role must be admin or tech.';
  END IF;

  -- Check if email already has an active account
  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE lower(email) = lower(p_email)
  ) THEN
    RAISE EXCEPTION 'A user with this email already exists.';
  END IF;

  -- Check if a pending invite already exists
  IF EXISTS (
    SELECT 1 FROM team_invites
    WHERE lower(email) = lower(p_email)
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A pending invite already exists for this email.';
  END IF;

  -- Create the invite
  INSERT INTO team_invites (email, role, invited_by)
  VALUES (lower(p_email), p_role, auth.uid())
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$;

-- 6. Public: Check if a pending invite exists for an email
CREATE OR REPLACE FUNCTION check_team_invite(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_invites
    WHERE lower(email) = lower(check_email)
    AND status = 'pending'
  );
END;
$$;

-- 7. Post-signup: Claim invite, create user_profiles, mark as claimed
CREATE OR REPLACE FUNCTION claim_team_invite(p_user_id UUID, p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Find the pending invite
  SELECT role INTO v_role
  FROM team_invites
  WHERE lower(email) = lower(p_email)
  AND status = 'pending'
  LIMIT 1;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'No pending invite found for this email.';
  END IF;

  -- Create user_profiles entry with the invited role
  INSERT INTO user_profiles (id, role, email)
  VALUES (p_user_id, v_role, lower(p_email))
  ON CONFLICT (id) DO UPDATE SET role = v_role, email = lower(p_email);

  -- Mark invite as claimed
  UPDATE team_invites
  SET status = 'claimed', claimed_at = NOW()
  WHERE lower(email) = lower(p_email)
  AND status = 'pending';

  RETURN v_role;
END;
$$;
