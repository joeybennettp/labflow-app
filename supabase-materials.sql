-- ============================================
-- Create materials + case_materials tables + RLS
-- Run this in Supabase SQL Editor
-- ============================================

-- Materials table
create table materials (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  sku text default '',
  category text default '',
  quantity numeric(10,2) default 0,
  unit text default 'pcs',
  reorder_level numeric(10,2) default 0,
  unit_cost numeric(10,2) default 0,
  supplier text default '',
  notes text default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Auto-update timestamp
create trigger update_materials_updated_at
  before update on materials
  for each row execute function update_updated_at_column();

-- Enable RLS
alter table materials enable row level security;

-- Lab staff only
create policy "Lab staff read materials"
  on materials for select
  using (is_lab_staff(auth.uid()));

create policy "Lab staff insert materials"
  on materials for insert
  with check (is_lab_staff(auth.uid()));

create policy "Lab staff update materials"
  on materials for update
  using (is_lab_staff(auth.uid()));

create policy "Lab staff delete materials"
  on materials for delete
  using (is_lab_staff(auth.uid()));

-- Case-Materials junction table
create table case_materials (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references cases(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  quantity_used numeric(10,2) default 1,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table case_materials enable row level security;

-- Lab staff only
create policy "Lab staff read case_materials"
  on case_materials for select
  using (is_lab_staff(auth.uid()));

create policy "Lab staff insert case_materials"
  on case_materials for insert
  with check (is_lab_staff(auth.uid()));

create policy "Lab staff delete case_materials"
  on case_materials for delete
  using (is_lab_staff(auth.uid()));
