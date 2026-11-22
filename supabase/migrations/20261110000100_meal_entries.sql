-- Run once in the Supabase SQL Editor after the profiles migration.
create table public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name text not null check (char_length(btrim(food_name)) between 1 and 120 and food_name = btrim(food_name)),
  quantity numeric(10, 2) check (quantity > 0 and quantity <= 100000),
  quantity_unit text check (quantity_unit is null or char_length(btrim(quantity_unit)) between 1 and 30),
  calories numeric(10, 2) check (calories >= 0 and calories <= 100000),
  protein_g numeric(10, 2) check (protein_g >= 0 and protein_g <= 10000),
  carbs_g numeric(10, 2) check (carbs_g >= 0 and carbs_g <= 10000),
  fat_g numeric(10, 2) check (fat_g >= 0 and fat_g <= 10000),
  entry_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_quantity_unit_pair check ((quantity is null and quantity_unit is null) or (quantity is not null and quantity_unit is not null))
);

create index meal_entries_user_date_idx on public.meal_entries (user_id, entry_date desc, created_at desc);

create or replace function public.set_meal_entry_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger meal_entries_updated_at before update on public.meal_entries
for each row execute function public.set_meal_entry_updated_at();

alter table public.meal_entries enable row level security;
revoke all on public.meal_entries from anon, authenticated;
grant select, insert, update, delete on public.meal_entries to authenticated;

create policy "Users read own meals" on public.meal_entries for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users add own meals" on public.meal_entries for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users update own meals" on public.meal_entries for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own meals" on public.meal_entries for delete to authenticated
using ((select auth.uid()) = user_id);
