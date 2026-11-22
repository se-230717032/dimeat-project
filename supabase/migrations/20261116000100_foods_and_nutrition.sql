-- Apply after 20261110000100_meal_entries.sql. Existing diary rows are preserved.
-- USDA FoodData Central values below were checked against the cited FDC IDs.
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  normalized_name text not null unique check (char_length(btrim(normalized_name)) between 1 and 160),
  calories_per_100g numeric(10, 2) check (calories_per_100g between 0 and 10000),
  protein_per_100g numeric(10, 2) check (protein_per_100g between 0 and 100),
  carbs_per_100g numeric(10, 2) check (carbs_per_100g between 0 and 100),
  fat_per_100g numeric(10, 2) check (fat_per_100g between 0 and 100),
  source text not null,
  source_food_id text not null,
  source_url text not null,
  piece_grams numeric(10, 2) check (piece_grams > 0),
  piece_label text,
  portion_grams numeric(10, 2) check (portion_grams > 0),
  portion_label text,
  created_at timestamptz not null default now(),
  unique (source, source_food_id)
);

create index foods_normalized_name_prefix_idx on public.foods (normalized_name text_pattern_ops);
alter table public.foods enable row level security;
revoke all on public.foods from anon, authenticated;
grant select on public.foods to authenticated;
create policy "Authenticated users read food catalog" on public.foods for select to authenticated using (true);
-- No INSERT/UPDATE/DELETE grant or policy for app users.

insert into public.foods
  (name, normalized_name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, source, source_food_id, source_url, piece_grams, piece_label, portion_grams, portion_label)
values
  ('Yumurta, bütün', 'yumurta butun', 148, 12.4, 0.96, 9.96, 'USDA FoodData Central', '748967', 'https://fdc.nal.usda.gov/food-details/748967/nutrients', 50.3, '1 büyük yumurta (kabuksuz)', null, null),
  ('Muz, çiğ', 'muz cig', 89, 1.09, 22.8, 0.33, 'USDA FoodData Central', '173944', 'https://fdc.nal.usda.gov/food-details/173944/nutrients', 118, '1 orta boy muz', 126, '1 USDA porsiyonu'),
  ('Pirinç, beyaz, orta taneli, pişmiş', 'pirinc beyaz orta taneli pismis', 130, 2.38, 28.6, 0.21, 'USDA FoodData Central', '168930', 'https://fdc.nal.usda.gov/food-details/168930/nutrients', null, null, 186, '1 cup pişmiş pirinç');

alter table public.meal_entries
  add column food_id uuid references public.foods(id) on delete set null,
  add column grams_used numeric(10, 2) check (grams_used > 0 and grams_used <= 100000),
  add column nutrition_source text,
  add column source_food_id text,
  add column nutrition_source_url text,
  add column nutrition_calculated boolean not null default false;

create index meal_entries_food_id_idx on public.meal_entries (food_id) where food_id is not null;
