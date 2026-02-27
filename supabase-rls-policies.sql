-- Allow public read access to cases and doctors (for now)
-- We'll tighten this later when we add authentication

alter table cases enable row level security;
alter table doctors enable row level security;

create policy "Allow public read access to cases"
  on cases for select
  using (true);

create policy "Allow public read access to doctors"
  on doctors for select
  using (true);
