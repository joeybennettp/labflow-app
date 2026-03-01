-- ============================================
-- LabFlow RLS Policies
-- Current-state Row Level Security policies
-- for all tables. Run AFTER schema.sql.
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DOCTORS
-- ============================================

CREATE POLICY "Lab staff can view all doctors"
  ON doctors FOR SELECT
  TO authenticated
  USING (is_lab_staff(auth.uid()));

CREATE POLICY "Doctors can view own record"
  ON doctors FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

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

-- ============================================
-- CASES
-- ============================================

CREATE POLICY "Lab staff can view all cases"
  ON cases FOR SELECT
  TO authenticated
  USING (is_lab_staff(auth.uid()));

CREATE POLICY "Doctors can view own cases"
  ON cases FOR SELECT
  TO authenticated
  USING (doctor_id = get_doctor_id_for_user());

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
-- USER PROFILES
-- ============================================

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE
  USING (is_admin(auth.uid()));

-- ============================================
-- LAB SETTINGS
-- ============================================

CREATE POLICY "Authenticated read lab_settings"
  ON lab_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert lab_settings"
  ON lab_settings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update lab_settings"
  ON lab_settings FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================
-- CASE ATTACHMENTS
-- ============================================

-- Lab staff
CREATE POLICY "Lab staff can view all attachments"
  ON case_attachments FOR SELECT
  USING (is_lab_staff(auth.uid()));

CREATE POLICY "Lab staff can upload attachments"
  ON case_attachments FOR INSERT
  WITH CHECK (is_lab_staff(auth.uid()));

CREATE POLICY "Lab staff can delete attachments"
  ON case_attachments FOR DELETE
  USING (is_lab_staff(auth.uid()));

-- Doctors
CREATE POLICY "Doctors can view attachments on own cases"
  ON case_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      JOIN doctors ON doctors.id = cases.doctor_id
      WHERE cases.id = case_attachments.case_id
      AND doctors.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can upload attachments to own cases"
  ON case_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      JOIN doctors ON doctors.id = cases.doctor_id
      WHERE cases.id = case_attachments.case_id
      AND doctors.auth_user_id = auth.uid()
    )
    AND uploaded_by_role = 'doctor'
  );

CREATE POLICY "Doctors can delete own attachments"
  ON case_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    AND uploaded_by_role = 'doctor'
  );

-- ============================================
-- CASE MESSAGES
-- ============================================

-- Lab staff
CREATE POLICY "Lab staff can view case messages"
  ON case_messages FOR SELECT
  USING (is_lab_staff(auth.uid()));

CREATE POLICY "Lab staff can send case messages"
  ON case_messages FOR INSERT
  WITH CHECK (
    is_lab_staff(auth.uid())
    AND sender_role = 'lab'
    AND sender_id = auth.uid()
  );

-- Doctors
CREATE POLICY "Doctors can view messages on own cases"
  ON case_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      JOIN doctors ON doctors.id = cases.doctor_id
      WHERE cases.id = case_messages.case_id
      AND doctors.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can send messages on own cases"
  ON case_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      JOIN doctors ON doctors.id = cases.doctor_id
      WHERE cases.id = case_messages.case_id
      AND doctors.auth_user_id = auth.uid()
    )
    AND sender_role = 'doctor'
    AND sender_id = auth.uid()
  );

-- ============================================
-- MATERIALS
-- ============================================

CREATE POLICY "Lab staff read materials"
  ON materials FOR SELECT
  USING (is_lab_staff(auth.uid()));

CREATE POLICY "Lab staff insert materials"
  ON materials FOR INSERT
  WITH CHECK (is_lab_staff(auth.uid()));

CREATE POLICY "Lab staff update materials"
  ON materials FOR UPDATE
  USING (is_lab_staff(auth.uid()));

CREATE POLICY "Lab staff delete materials"
  ON materials FOR DELETE
  USING (is_lab_staff(auth.uid()));

-- ============================================
-- CASE MATERIALS
-- ============================================

CREATE POLICY "Lab staff read case_materials"
  ON case_materials FOR SELECT
  USING (is_lab_staff(auth.uid()));

CREATE POLICY "Lab staff insert case_materials"
  ON case_materials FOR INSERT
  WITH CHECK (is_lab_staff(auth.uid()));

CREATE POLICY "Lab staff delete case_materials"
  ON case_materials FOR DELETE
  USING (is_lab_staff(auth.uid()));

-- ============================================
-- ACTIVITY LOG
-- ============================================

CREATE POLICY "Lab staff read activity_log"
  ON activity_log FOR SELECT
  USING (is_lab_staff(auth.uid()));

CREATE POLICY "Lab staff insert activity_log"
  ON activity_log FOR INSERT
  WITH CHECK (is_lab_staff(auth.uid()));

CREATE POLICY "Doctors read own case activity"
  ON activity_log FOR SELECT
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN doctors d ON c.doctor_id = d.id
      WHERE d.auth_user_id = auth.uid()
    )
  );

-- ============================================
-- TEAM INVITES
-- ============================================

CREATE POLICY "Admins can read invites"
  ON team_invites FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert invites"
  ON team_invites FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update invites"
  ON team_invites FOR UPDATE
  USING (is_admin(auth.uid()));
