create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());
