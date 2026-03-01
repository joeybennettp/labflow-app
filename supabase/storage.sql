-- ============================================
-- LabFlow Storage Configuration
-- Storage bucket and access policies for
-- case file attachments.
-- ============================================

-- Create private storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-attachments', 'case-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- LAB STAFF STORAGE POLICIES
-- ============================================

CREATE POLICY "Lab staff can upload case files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'case-attachments'
    AND is_lab_staff(auth.uid())
  );

CREATE POLICY "Lab staff can read case files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'case-attachments'
    AND is_lab_staff(auth.uid())
  );

CREATE POLICY "Lab staff can delete case files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'case-attachments'
    AND is_lab_staff(auth.uid())
  );

-- ============================================
-- DOCTOR STORAGE POLICIES
-- ============================================

CREATE POLICY "Doctors can upload case files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'case-attachments'
    AND EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can read own case files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'case-attachments'
    AND EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can delete own case files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'case-attachments'
    AND EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.auth_user_id = auth.uid()
    )
  );
