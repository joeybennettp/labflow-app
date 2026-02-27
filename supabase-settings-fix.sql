-- ============================================
-- Fix: Drop partial table and recreate
-- Run this in Supabase SQL Editor
-- ============================================

drop table if exists lab_settings;

create table lab_settings (
  id uuid default gen_random_uuid() primary key,
  lab_name text not null default 'My Dental Lab',
  address text default '',
  city text default '',
  state text default '',
  zip text default '',
  phone text default '',
  email text default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Auto-update timestamp function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_lab_settings_updated_at
  before update on lab_settings
  for each row execute function update_updated_at_column();

-- Enable RLS
alter table lab_settings enable row level security;

-- Authenticated-only policies
create policy "Authenticated read lab_settings"
  on lab_settings for select
  using (auth.role() = 'authenticated');

create policy "Authenticated insert lab_settings"
  on lab_settings for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated update lab_settings"
  on lab_settings for update
  using (auth.role() = 'authenticated');

-- Insert a default row
insert into lab_settings (lab_name) values ('My Dental Lab');
