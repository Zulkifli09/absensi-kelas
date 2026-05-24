create table if not exists public.attendance_profiles (
  id text not null default 'primary',
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (id, user_id)
);

alter table public.attendance_profiles enable row level security;

drop policy if exists "Users can read own attendance profile" on public.attendance_profiles;
create policy "Users can read own attendance profile"
on public.attendance_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own attendance profile" on public.attendance_profiles;
create policy "Users can insert own attendance profile"
on public.attendance_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own attendance profile" on public.attendance_profiles;
create policy "Users can update own attendance profile"
on public.attendance_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
