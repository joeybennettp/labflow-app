-- ============================================
-- Update RLS policies: public → authenticated
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop old public policies
drop policy if exists "Allow public read access to cases" on cases;
drop policy if exists "Allow public read access to doctors" on doctors;
drop policy if exists "Allow public insert on cases" on cases;
drop policy if exists "Allow public update on cases" on cases;

-- New authenticated-only policies
create policy "Authenticated read cases"
  on cases for select
  using (auth.role() = 'authenticated');

create policy "Authenticated insert cases"
  on cases for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated update cases"
  on cases for update
  using (auth.role() = 'authenticated');

create policy "Authenticated read doctors"
  on doctors for select
  using (auth.role() = 'authenticated');
