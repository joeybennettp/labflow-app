-- ============================================
-- Add delete policy for cases table
-- Run this in Supabase SQL Editor
-- ============================================

create policy "Authenticated delete cases"
  on cases for delete
  using (auth.role() = 'authenticated');
