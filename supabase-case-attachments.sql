-- =============================================================
-- Case Attachments: table + storage bucket + RLS policies
-- Run this in Supabase SQL Editor
-- =============================================================

-- 1. Create case_attachments table
CREATE TABLE IF NOT EXISTS case_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,        -- path inside the storage bucket
  file_size INTEGER NOT NULL,     -- bytes
  file_type TEXT NOT NULL,        -- MIME type (image/jpeg, application/pdf, etc.)
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_by_role TEXT NOT NULL DEFAULT 'lab',  -- 'lab' or 'doctor'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by case
CREATE INDEX idx_case_attachments_case_id ON case_attachments(case_id);

-- 2. RLS on case_attachments
ALTER TABLE case_attachments ENABLE ROW LEVEL SECURITY;

-- Lab staff (admin/tech) can see all attachments
CREATE POLICY "Lab staff can view all attachments"
  ON case_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'tech')
    )
  );

-- Lab staff can insert attachments
CREATE POLICY "Lab staff can upload attachments"
  ON case_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'tech')
    )
  );

-- Lab staff can delete attachments
CREATE POLICY "Lab staff can delete attachments"
  ON case_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'tech')
    )
  );

-- 3. Create storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-attachments', 'case-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS policies

-- Lab staff can upload files
CREATE POLICY "Lab staff can upload case files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'case-attachments'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'tech')
    )
  );

-- Lab staff can read files
CREATE POLICY "Lab staff can read case files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'case-attachments'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'tech')
    )
  );

-- Lab staff can delete files
CREATE POLICY "Lab staff can delete case files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'case-attachments'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'tech')
    )
  );
