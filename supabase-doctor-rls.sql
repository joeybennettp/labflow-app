-- ============================================
-- Add write policies for doctors table
-- Run this in Supabase SQL Editor
-- ============================================

create policy "Authenticated insert doctors"
  on doctors for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated update doctors"
  on doctors for update
  using (auth.role() = 'authenticated');

create policy "Authenticated delete doctors"
  on doctors for delete
  using (auth.role() = 'authenticated');
