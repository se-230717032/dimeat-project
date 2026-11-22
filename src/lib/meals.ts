export const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof mealTypes)[number];

export const mealLabels: Record<MealType, string> = {
  breakfast: "Kahvaltı",
  lunch: "Öğle",
  dinner: "Akşam",
  snack: "Atıştırmalık",
};

export type MealEntry = {
  id: string;
  user_id: string;
  meal_type: MealType;
  food_name: string;
  quantity: number | null;
  quantity_unit: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  food_id: string | null;
  grams_used: number | null;
  nutrition_source: string | null;
  source_food_id: string | null;
  nutrition_source_url: string | null;
  nutrition_calculated: boolean;
  entry_date: string;
  created_at: string;
};

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= "1900-01-01" && value <= "2100-12-31";
}

export function daySummary(entries: MealEntry[]) {
  const total = (key: "calories" | "protein_g" | "carbs_g" | "fat_g") => ({
    value: entries.reduce((sum, entry) => sum + (entry[key] ?? 0), 0),
    known: entries.some((entry) => entry[key] !== null),
    incomplete: entries.some((entry) => entry[key] === null),
  });
  return {
    foods: entries.length,
    meals: new Set(entries.map((entry) => entry.meal_type)).size,
    calories: total("calories"),
    protein: total("protein_g"),
    carbs: total("carbs_g"),
    fat: total("fat_g"),
  };
}
