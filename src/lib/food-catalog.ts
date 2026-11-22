export type FoodResult = {
  id: string;
  name: string;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  source: "USDA FoodData Central" | "Open Food Facts";
  source_food_id: string;
  source_url: string;
  piece_grams: number | null;
  piece_label: string | null;
  portion_grams: number | null;
  portion_label: string | null;
  origin: "catalog" | "usda" | "off";
};

export function normalizeFoodName(value: string) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

export function calculateNutrition(food: FoodResult, grams: number) {
  if (!Number.isFinite(grams) || grams <= 0 || grams > 100000) return null;
  const scaled = (value: number | null) => value === null ? null : Math.round((value * grams / 100) * 100) / 100;
  return {
    calories: scaled(food.calories_per_100g),
    protein_g: scaled(food.protein_per_100g),
    carbs_g: scaled(food.carbs_per_100g),
    fat_g: scaled(food.fat_per_100g),
  };
}

export function gramsForQuantity(quantity: number, unit: string, gramsPerUnit: number | null) {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  if (unit === "g") return quantity;
  if ((unit === "adet" || unit === "porsiyon") && gramsPerUnit !== null && Number.isFinite(gramsPerUnit) && gramsPerUnit > 0) return Math.round(quantity * gramsPerUnit * 100) / 100;
  return null;
}
