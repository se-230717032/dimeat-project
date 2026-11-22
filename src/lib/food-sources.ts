import "server-only";
import type { FoodResult } from "@/lib/food-catalog";
import { createClient } from "@/lib/supabase/server";

type UsdaNutrient = { nutrientId?: number; nutrient?: { id?: number; unitName?: string }; value?: number; amount?: number; unitName?: string };
type UsdaFood = { fdcId?: number; description?: string; foodNutrients?: UsdaNutrient[]; foodPortions?: { gramWeight?: number; amount?: number; modifier?: string; measureUnit?: { name?: string } }[] };
type OffProduct = { code?: string; product_name?: string; product_name_tr?: string; product_name_en?: string; brands?: string; nutriments?: Record<string, unknown> };

const cache = new Map<string, { until: number; foods: FoodResult[] }>();
const detailCache = new Map<string, { until: number; food: FoodResult }>();
const calls = new Map<string, number[]>();

function allowed(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (calls.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) return false;
  calls.set(key, [...recent, now]);
  return true;
}

function nutrient(food: UsdaFood, id: number) {
  const item = food.foodNutrients?.find((value) => (value.nutrientId ?? value.nutrient?.id) === id);
  const amount = item?.value ?? item?.amount;
  return typeof amount === "number" && Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function usdaFood(food: UsdaFood): FoodResult | null {
  if (!food.fdcId || !food.description) return null;
  const portions = food.foodPortions ?? [];
  const piece = portions.find((item) => item.measureUnit?.name === "egg" && item.amount === 1 && item.gramWeight && item.gramWeight > 0);
  return {
    id: `usda:${food.fdcId}`, name: food.description,
    calories_per_100g: nutrient(food, 1008) ?? nutrient(food, 2047) ?? nutrient(food, 2048),
    protein_per_100g: nutrient(food, 1003), carbs_per_100g: nutrient(food, 1005), fat_per_100g: nutrient(food, 1004),
    source: "USDA FoodData Central", source_food_id: String(food.fdcId),
    source_url: `https://fdc.nal.usda.gov/food-details/${food.fdcId}/nutrients`,
    piece_grams: piece?.gramWeight ?? null, piece_label: piece ? `1 ${piece.modifier ?? "adet"}` : null,
    portion_grams: null, portion_label: null, origin: "usda",
  };
}

function offNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function offFood(product: OffProduct): FoodResult | null {
  const productName = product.product_name_tr || product.product_name || product.product_name_en;
  if (!product.code || !/^\d{6,14}$/.test(product.code) || !productName) return null;
  const nutrients = product.nutriments ?? {};
  const kcal = offNumber(nutrients["energy-kcal_100g"]);
  const kj = offNumber(nutrients["energy-kj_100g"]);
  const food: FoodResult = {
    id: `off:${product.code}`, name: product.brands ? `${productName} · ${product.brands}` : productName,
    calories_per_100g: kcal ?? (kj === null ? null : Math.round(kj / 4.184 * 100) / 100),
    protein_per_100g: offNumber(nutrients.proteins_100g), carbs_per_100g: offNumber(nutrients.carbohydrates_100g), fat_per_100g: offNumber(nutrients.fat_100g),
    source: "Open Food Facts", source_food_id: product.code,
    source_url: `https://world.openfoodfacts.org/product/${product.code}`,
    piece_grams: null, piece_label: null, portion_grams: null, portion_label: null, origin: "off",
  };
  return [food.calories_per_100g, food.protein_per_100g, food.carbs_per_100g, food.fat_per_100g].some((value) => value !== null) ? food : null;
}

export async function catalogFoods(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("foods")
    .select("id,name,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,source,source_food_id,source_url,piece_grams,piece_label,portion_grams,portion_label")
    .like("normalized_name", `%${query}%`).order("normalized_name").limit(20);
  if (error) throw error;
  return (data ?? []).map((food) => ({ ...food, origin: "catalog" as const })) as FoodResult[];
}

export async function catalogFood(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("foods")
    .select("id,name,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,source,source_food_id,source_url,piece_grams,piece_label,portion_grams,portion_label")
    .eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? { ...data, origin: "catalog" as const } as FoodResult : null;
}

export async function usdaSearch(query: string) {
  const key = `usda:${query}`;
  const cached = cache.get(key);
  if (cached && cached.until > Date.now()) return cached.foods;
  if (!allowed("usda", process.env.USDA_API_KEY ? 900 : 24, 60 * 60 * 1000)) throw new Error("USDA arama sınırına ulaşıldı. Biraz sonra tekrar dene.");
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", process.env.USDA_API_KEY || "DEMO_KEY");
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, dataType: ["Survey (FNDDS)", "SR Legacy", "Foundation"], pageSize: 24 }), signal: AbortSignal.timeout(8000) });
  if (response.status === 429) throw new Error("USDA arama sınırına ulaşıldı. Biraz sonra tekrar dene.");
  if (!response.ok) throw new Error("USDA araması şu anda kullanılamıyor.");
  const body = await response.json() as { foods?: UsdaFood[] };
  const terms = query.toLowerCase().match(/[a-z]+/g) ?? [];
  const matchesTerm = (term: string, word: string) => word === term || word === `${term}s` || term === `${word}s` || (term.length >= 5 && word.startsWith(term));
  const score = (food: FoodResult) => {
    const name = food.name.toLowerCase();
    const words = name.match(/[a-z]+/g) ?? [];
    const first = terms[0] ?? "";
    const matches = terms.filter((term) => words.some((word) => matchesTerm(term, word))).length;
    const contradiction = first.startsWith("meatball") && /meatless/.test(name) ? 100 : 0;
    return matches * 30 + (words.some((word) => matchesTerm(first, word)) ? 15 : 0) - Math.min(name.length, 120) / 10 - contradiction;
  };
  const foods = (body.foods ?? []).map(usdaFood).filter((food): food is FoodResult => food !== null && [food.calories_per_100g, food.protein_per_100g, food.carbs_per_100g, food.fat_per_100g].some((value) => value !== null) && terms.every((term) => (food.name.toLowerCase().match(/[a-z]+/g) ?? []).some((word) => matchesTerm(term, word))) && !(terms[0]?.startsWith("meatball") && /meatless/i.test(food.name))).sort((a, b) => score(b) - score(a)).slice(0, 12);
  for (const food of foods) detailCache.set(`usda:${food.source_food_id}`, { food, until: Date.now() + 24 * 60 * 60 * 1000 });
  cache.set(key, { until: Date.now() + 24 * 60 * 60 * 1000, foods });
  return foods;
}

export async function usdaDetail(id: string) {
  if (!/^\d{1,12}$/.test(id)) return null;
  const cached = detailCache.get(`usda:${id}`);
  if (cached && cached.until > Date.now()) return cached.food;
  if (!allowed("usda", process.env.USDA_API_KEY ? 900 : 24, 60 * 60 * 1000)) throw new Error("USDA arama sınırına ulaşıldı.");
  const url = new URL(`https://api.nal.usda.gov/fdc/v1/food/${id}`);
  url.searchParams.set("api_key", process.env.USDA_API_KEY || "DEMO_KEY");
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const food = usdaFood(await response.json() as UsdaFood);
  if (food) detailCache.set(`usda:${id}`, { until: Date.now() + 60 * 60 * 1000, food });
  return food;
}

function offAgent() {
  const email = process.env.OPEN_FOOD_FACTS_CONTACT_EMAIL;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Open Food Facts araması için sunucuya iletişim e-postası eklenmeli.");
  return `Dimeat/0.1 (${email})`;
}

export async function offSearch(query: string) {
  const key = `off:${query}`;
  const cached = cache.get(key);
  if (cached && cached.until > Date.now()) return cached.foods;
  const agent = offAgent();
  if (!allowed("off", 6, 60 * 1000)) throw new Error("Paketli ürün arama sınırına ulaşıldı. Bir dakika sonra tekrar dene.");
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  for (const [name, value] of Object.entries({ search_terms: query, search_simple: "1", action: "process", json: "1", page_size: "8", fields: "code,product_name,product_name_tr,product_name_en,brands,nutriments" })) url.searchParams.set(name, value);
  const response = await fetch(url, { headers: { "User-Agent": agent }, signal: AbortSignal.timeout(8000) });
  if (response.status === 503) throw new Error("Open Food Facts şu anda yoğun veya istek sınırında. Bir süre sonra tekrar dene ya da manuel giriş yap.");
  if (!response.ok) throw new Error("Open Food Facts şu anda kullanılamıyor.");
  const body = await response.json() as { products?: OffProduct[] };
  const foods = (body.products ?? []).map(offFood).filter((food): food is FoodResult => food !== null);
  for (const food of foods) detailCache.set(`off:${food.source_food_id}`, { food, until: Date.now() + 15 * 60 * 1000 });
  cache.set(key, { until: Date.now() + 15 * 60 * 1000, foods });
  return foods;
}

export async function offDetail(code: string) {
  if (!/^\d{6,14}$/.test(code)) return null;
  const agent = offAgent();
  const cached = detailCache.get(`off:${code}`);
  if (cached && cached.until > Date.now()) return cached.food;
  if (!allowed("off-product", 10, 60 * 1000)) throw new Error("Paketli ürün sorgu sınırına ulaşıldı.");
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=code,product_name,product_name_tr,product_name_en,brands,nutriments`, { headers: { "User-Agent": agent }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const body = await response.json() as { product?: OffProduct };
  const food = body.product ? offFood(body.product) : null;
  if (food) detailCache.set(`off:${code}`, { until: Date.now() + 60 * 60 * 1000, food });
  return food;
}
