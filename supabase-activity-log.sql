-- ============================================
-- Create activity_log table + RLS policies
-- Run this in Supabase SQL Editor
-- ============================================

create table activity_log (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references cases(id) on delete set null,
  user_id uuid references auth.users(id),
  user_name text not null default 'Unknown',
  action text not null,
  details jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Index for faster queries
create index idx_activity_log_created_at on activity_log(created_at desc);
create index idx_activity_log_case_id on activity_log(case_id);

-- Enable RLS
alter table activity_log enable row level security;

-- Lab staff: full read + insert
create policy "Lab staff read activity_log"
  on activity_log for select
  using (is_lab_staff(auth.uid()));

create policy "Lab staff insert activity_log"
  on activity_log for insert
  with check (is_lab_staff(auth.uid()));

-- Doctors: read logs for their own cases only
create policy "Doctors read own case activity"
  on activity_log for select
  using (
    case_id in (
      select c.id from cases c
      join doctors d on c.doctor_id = d.id
      where d.auth_user_id = auth.uid()
    )
  );
