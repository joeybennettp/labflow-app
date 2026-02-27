-- LabFlow Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- ============================================
-- DOCTORS TABLE
-- ============================================
create table doctors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  practice text not null,
  email text,
  phone text,
  created_at timestamp with time zone default now()
);

-- ============================================
-- CASES TABLE
-- ============================================
create table cases (
  id uuid default gen_random_uuid() primary key,
  case_number text unique not null,        -- e.g. "C-4571"
  patient text not null,
  doctor_id uuid references doctors(id) on delete set null,
  type text not null,                       -- restoration type, e.g. "Zirconia Crown"
  shade text default 'A2',
  status text default 'received' check (status in (
    'received', 'in_progress', 'quality_check', 'ready', 'shipped'
  )),
  rush boolean default false,
  due date not null,
  price numeric(10,2) default 0,
  notes text,
  invoiced boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- AUTO-INCREMENT CASE NUMBERS
-- ============================================
-- This function generates the next "C-XXXX" number automatically
create or replace function generate_case_number()
returns trigger as $$
declare
  next_num integer;
begin
  select coalesce(max(cast(substring(case_number from 3) as integer)), 4570) + 1
  into next_num
  from cases;
  new.case_number := 'C-' || next_num;
  return new;
end;
$$ language plpgsql;

create trigger set_case_number
  before insert on cases
  for each row
  when (new.case_number is null or new.case_number = '')
  execute function generate_case_number();

-- ============================================
-- AUTO-UPDATE "updated_at" TIMESTAMP
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger cases_updated_at
  before update on cases
  for each row
  execute function update_updated_at();

-- ============================================
-- SEED DATA (same as your demo)
-- ============================================

-- Insert doctors
insert into doctors (id, name, practice, email, phone) values
  ('d1000000-0000-0000-0000-000000000001', 'Dr. Sarah Chen', 'Bright Smile Dental', 'chen@brightsmile.com', '(555) 100-2001'),
  ('d1000000-0000-0000-0000-000000000002', 'Dr. Michael Torres', 'Torres Family Dentistry', 'torres@torresfamily.com', '(555) 100-2002'),
  ('d1000000-0000-0000-0000-000000000003', 'Dr. Priya Patel', 'Downtown Dental Group', 'patel@downtowndental.com', '(555) 100-2003'),
  ('d1000000-0000-0000-0000-000000000004', 'Dr. James Whitfield', 'Whitfield Orthodontics', 'whitfield@whitfieldortho.com', '(555) 100-2004');

-- Insert cases
insert into cases (case_number, patient, doctor_id, type, shade, status, rush, due, price, notes, invoiced) values
  ('C-4571', 'Margaret Thompson', 'd1000000-0000-0000-0000-000000000001', 'Zirconia Crown', 'A2', 'in_progress', false, current_date + interval '3 days', 285.00, 'Upper right first molar. Patient prefers high-translucency zirconia.', false),
  ('C-4572', 'Robert Garcia', 'd1000000-0000-0000-0000-000000000002', 'PFM Bridge', 'B1', 'received', true, current_date + interval '1 day', 950.00, '3-unit bridge #3-5. RUSH - patient traveling.', false),
  ('C-4573', 'Susan Williams', 'd1000000-0000-0000-0000-000000000001', 'E.max Veneer', 'BL2', 'quality_check', false, current_date + interval '5 days', 420.00, 'Veneer set #6-11. Match to existing #5. Photos attached.', false),
  ('C-4574', 'David Kim', 'd1000000-0000-0000-0000-000000000003', 'Implant Crown', 'A3', 'ready', false, current_date, 375.00, 'Implant #14, Nobel Active NP. Screw-retained.', false),
  ('C-4575', 'Patricia Martinez', 'd1000000-0000-0000-0000-000000000002', 'Full Denture', 'A2', 'in_progress', false, current_date + interval '7 days', 1200.00, 'Upper complete denture. Ivoclar teeth. Setup appointment scheduled.', false),
  ('C-4576', 'James Anderson', 'd1000000-0000-0000-0000-000000000004', 'Night Guard', '-', 'shipped', false, current_date - interval '1 day', 150.00, 'Hard/soft dual laminate. Delivered via UPS.', true),
  ('C-4577', 'Linda Brown', 'd1000000-0000-0000-0000-000000000003', 'Zirconia Crown', 'C2', 'received', false, current_date + interval '4 days', 285.00, 'Lower left second premolar. Monolithic.', false),
  ('C-4578', 'Michael Davis', 'd1000000-0000-0000-0000-000000000001', 'Custom Abutment', 'A3.5', 'in_progress', true, current_date + interval '2 days', 310.00, 'Titanium abutment #8. Straumann BLT RC. RUSH.', false),
  ('C-4579', 'Jennifer Wilson', 'd1000000-0000-0000-0000-000000000004', 'Surgical Guide', '-', 'quality_check', false, current_date + interval '6 days', 225.00, 'Full arch guide for implants #7, #8, #10.', false),
  ('C-4580', 'Richard Taylor', 'd1000000-0000-0000-0000-000000000002', 'PFM Crown', 'D3', 'received', false, current_date + interval '8 days', 245.00, 'Upper right canine. High noble metal.', false),
  ('C-4581', 'Barbara Jones', 'd1000000-0000-0000-0000-000000000003', 'E.max Crown', 'A1', 'in_progress', false, current_date + interval '4 days', 320.00, 'Central incisor #9. Ultra-thin prep.', false),
  ('C-4582', 'Thomas Moore', 'd1000000-0000-0000-0000-000000000001', 'Partial Denture', 'B2', 'received', false, current_date + interval '10 days', 875.00, 'Lower partial with precision attachments. Chrome cobalt frame.', false);
