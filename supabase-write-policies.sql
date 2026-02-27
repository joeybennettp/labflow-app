-- Allow insert and update on cases (public for now, will lock down with auth later)

create policy "Allow public insert on cases"
  on cases for insert
  with check (true);

create policy "Allow public update on cases"
  on cases for update
  using (true);
