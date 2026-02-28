-- =============================================================
-- Doctor Portal Attachment Policies
-- Allows doctors to view, upload, and delete their own attachments
-- on cases that belong to them (via RLS on cases table)
-- Run this in Supabase SQL Editor AFTER supabase-case-attachments.sql
-- =============================================================

-- Doctors can view attachments on their own cases
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

-- Doctors can upload attachments to their own cases
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

-- Doctors can delete only their own uploads
CREATE POLICY "Doctors can delete own attachments"
  ON case_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    AND uploaded_by_role = 'doctor'
  );

-- Storage: Doctors can upload files
CREATE POLICY "Doctors can upload case files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'case-attachments'
    AND EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.auth_user_id = auth.uid()
    )
  );

-- Storage: Doctors can read files on their own cases
CREATE POLICY "Doctors can read own case files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'case-attachments'
    AND EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.auth_user_id = auth.uid()
    )
  );

-- Storage: Doctors can delete their own uploaded files
CREATE POLICY "Doctors can delete own case files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'case-attachments'
    AND EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.auth_user_id = auth.uid()
    )
  );
