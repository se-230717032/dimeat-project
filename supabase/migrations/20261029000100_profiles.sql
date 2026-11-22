-- Dimeat Prompt 2: private profiles and onboarding data.
-- A unique index on lower(username) makes Ebru and ebru collide.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text,
  birth_date date,
  height_cm numeric(5, 2),
  current_weight_kg numeric(6, 2),
  target_weight_kg numeric(6, 2),
  goal_type text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) between 3 and 30),
  constraint profiles_username_trimmed check (username = btrim(username)),
  constraint profiles_birth_date_valid check (birth_date is null or birth_date <= current_date),
  constraint profiles_height_valid check (height_cm is null or height_cm between 50 and 300),
  constraint profiles_current_weight_valid check (current_weight_kg is null or current_weight_kg > 0 and current_weight_kg <= 700),
  constraint profiles_target_weight_valid check (target_weight_kg is null or target_weight_kg > 0 and target_weight_kg <= 700),
  constraint profiles_goal_valid check (goal_type is null or goal_type in ('lose', 'maintain', 'gain')),
  constraint profiles_onboarding_complete_valid check (
    not onboarding_completed or
    (birth_date is not null and height_cm is not null and current_weight_kg is not null and target_weight_kg is not null and goal_type is not null)
  )
);

create unique index if not exists profiles_username_lower_unique on public.profiles (lower(username));

create or replace function public.set_profile_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_profile_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  requested_username text;
begin
  requested_username := btrim(new.raw_user_meta_data ->> 'username');
  if requested_username is null or requested_username = '' then
    requested_username := 'user_' || left(replace(new.id::text, '-', ''), 25);
  end if;
  insert into public.profiles (id, username) values (new.id, requested_username);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- This function exposes availability only, never private profile fields.
create or replace function public.username_available(candidate text)
returns boolean language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(btrim(candidate))
  );
$$;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select, update on public.profiles to authenticated;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- INSERT is deliberately reserved for the auth.users trigger. No client INSERT grant/policy.
