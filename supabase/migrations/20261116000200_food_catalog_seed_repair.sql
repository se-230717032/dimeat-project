-- Apply after 20261116000100_foods_and_nutrition.sql.
-- Idempotently adds verified USDA FoodData Central (CC0) foods.
-- Existing foods and meal_entries are not changed.
insert into public.foods
  (name, normalized_name, calories_per_100g, protein_per_100g, carbs_per_100g,
   fat_per_100g, source, source_food_id, source_url, piece_grams, piece_label,
   portion_grams, portion_label)
values
  ('Yumurta, bütün', 'yumurta butun', 148, 12.4, 0.96, 9.96,
   'USDA FoodData Central', '748967', 'https://fdc.nal.usda.gov/food-details/748967/nutrients',
   50.3, '1 büyük yumurta (kabuksuz)', null, null),
  ('Muz, çiğ', 'muz cig', 89, 1.09, 22.8, 0.33,
   'USDA FoodData Central', '173944', 'https://fdc.nal.usda.gov/food-details/173944/nutrients',
   118, '1 orta boy muz', 126, '1 USDA porsiyonu'),
  ('Pirinç, beyaz, orta taneli, pişmiş', 'pirinc beyaz orta taneli pismis', 130, 2.38, 28.6, 0.21,
   'USDA FoodData Central', '168930', 'https://fdc.nal.usda.gov/food-details/168930/nutrients',
   null, null, 186, '1 cup pişmiş pirinç'),
  ('Haşlanmış yumurta', 'haslanmis yumurta', 155, 12.6, 1.12, 10.6,
   'USDA FoodData Central', '173424', 'https://fdc.nal.usda.gov/food-details/173424/nutrients',
   50, '1 büyük haşlanmış yumurta', null, null),
  ('Makarna, pişmiş, tuzsuz', 'makarna pismis tuzsuz', 158, 5.8, 30.9, 0.93,
   'USDA FoodData Central', '168928', 'https://fdc.nal.usda.gov/food-details/168928/nutrients',
   null, null, null, null)
on conflict do nothing;
