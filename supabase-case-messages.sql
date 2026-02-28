-- =============================================================
-- Case Messages
-- Per-case messaging between lab staff and doctors
-- Run this in Supabase SQL Editor
-- =============================================================

-- Messages table
CREATE TABLE case_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('lab', 'doctor')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_case_messages_case_id ON case_messages(case_id);

ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;

-- Lab staff (admin/tech) can read messages on any case
CREATE POLICY "Lab staff can view case messages"
  ON case_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'tech')
    )
  );

-- Lab staff can send messages on any case
CREATE POLICY "Lab staff can send case messages"
  ON case_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'tech')
    )
    AND sender_role = 'lab'
    AND sender_id = auth.uid()
  );

-- Doctors can read messages on their own cases
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

-- Doctors can send messages on their own cases
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
