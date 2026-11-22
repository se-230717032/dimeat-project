"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidDate, mealTypes, type MealType } from "@/lib/meals";
import { calculateNutrition, gramsForQuantity } from "@/lib/food-catalog";
import { catalogFood, offDetail, usdaDetail } from "@/lib/food-sources";

type Result = { ok: true; nutritionStatus?: "calculated" | "manual" | "unknown" } | { ok: false; message: string };
type MealInput = Record<string, unknown>;

function numberValue(value: unknown, label: string, max: number, positive = false) {
  if (value === null || value === undefined || value === "") return { value: null as number | null };
  if (typeof value !== "string" && typeof value !== "number") return { error: `${label} geçerli bir sayı olmalı.` };
  const text = String(value).trim().replace(",", ".");
  if (!/^(?:\d+)(?:\.\d{1,2})?$/.test(text)) return { error: `${label} en fazla iki ondalıklı bir sayı olmalı.` };
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed > max || (positive ? parsed <= 0 : parsed < 0)) return { error: `${label} için geçerli bir değer gir.` };
  return { value: parsed };
}

function validateMeal(input: MealInput) {
  const foodName = typeof input.food_name === "string" ? input.food_name.trim() : "";
  const mealType = input.meal_type;
  const entryDate = input.entry_date;
  const unit = typeof input.quantity_unit === "string" ? input.quantity_unit.trim() : "";
  if (!foodName || foodName.length > 120) return { error: "Yemek adı 1–120 karakter olmalı." };
  if (typeof mealType !== "string" || !mealTypes.includes(mealType as MealType)) return { error: "Geçerli bir öğün seç." };
  if (typeof entryDate !== "string" || !isValidDate(entryDate)) return { error: "Geçerli bir tarih seç." };
  const quantity = numberValue(input.quantity, "Miktar", 100000, true);
  const calories = numberValue(input.calories, "Kalori", 100000);
  const protein = numberValue(input.protein_g, "Protein", 10000);
  const carbs = numberValue(input.carbs_g, "Karbonhidrat", 10000);
  const fat = numberValue(input.fat_g, "Yağ", 10000);
  for (const field of [quantity, calories, protein, carbs, fat]) if (field.error) return { error: field.error };
  if (quantity.value !== null && (!unit || unit.length > 30)) return { error: "Miktar için geçerli bir birim gir." };
  if (quantity.value === null && unit) return { error: "Birim kullanmak için miktar gir." };
  return { data: {
    food_name: foodName,
    meal_type: mealType as MealType,
    entry_date: entryDate,
    quantity: quantity.value ?? null,
    quantity_unit: unit || null,
    calories: calories.value ?? null,
    protein_g: protein.value ?? null,
    carbs_g: carbs.value ?? null,
    fat_g: fat.value ?? null,
  } };
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}

export async function saveMeal(input: MealInput, id?: string): Promise<Result> {
  const validated = validateMeal(input);
  if (validated.error || !validated.data) return { ok: false, message: validated.error ?? "Yemek bilgilerini kontrol et." };
  if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { ok: false, message: "Geçersiz yemek kaydı." };
  try {
    const { supabase, user } = await authenticatedClient();
    if (!user) return { ok: false, message: "Oturumun sona erdi. Yeniden giriş yap." };
    let mealData: Record<string, unknown> = validated.data;
    let nutritionStatus: "calculated" | "manual" | "unknown" = "unknown";
    const origin = input.food_origin;
    if (origin === "catalog" || origin === "usda" || origin === "off") {
      const reference = input.food_reference;
      if (typeof reference !== "string" || reference.length > 80) return { ok: false, message: "Besin seçimini yeniden yap." };
      const food = origin === "catalog" ? await catalogFood(reference) : origin === "usda" ? await usdaDetail(reference) : await offDetail(reference);
      if (!food) return { ok: false, message: "Seçilen besin doğrulanamadı. Tekrar ara veya manuel giriş yap." };
      const quantity = validated.data.quantity;
      const unit = validated.data.quantity_unit;
      if (quantity === null || !["g", "adet", "porsiyon"].includes(unit ?? "")) return { ok: false, message: "Otomatik hesaplama için gram, adet veya porsiyon miktarı gir." };
      const verifiedGrams = unit === "adet" ? food.piece_grams : unit === "porsiyon" ? food.portion_grams : null;
      if (unit !== "g" && verifiedGrams === null) return { ok: false, message: "Bu besinin doğrulanmış adet veya porsiyon gram karşılığı yok. Gram kullan." };
      const customGrams = numberValue(input.grams_per_unit, "Gram karşılığı", 100000, true);
      if (customGrams.error) return { ok: false, message: customGrams.error };
      const grams = gramsForQuantity(quantity, unit ?? "", unit === "g" ? null : customGrams.value ?? verifiedGrams);
      if (grams === null || grams > 100000) return { ok: false, message: "Miktar için geçerli bir gram karşılığı gir." };
      const nutrition = calculateNutrition(food, grams);
      if (!nutrition || [nutrition.calories, nutrition.protein_g, nutrition.carbs_g, nutrition.fat_g].some((value) => value === null)) return { ok: false, message: "Seçilen besinin kalori veya makro değerleri eksik. Başka besin seç veya manuel kayıt için ayrıca onay ver." };
      if ((nutrition.calories ?? 0) > 100000 || [nutrition.protein_g, nutrition.carbs_g, nutrition.fat_g].some((value) => (value ?? 0) > 10000)) return { ok: false, message: "Miktar çok yüksek. Daha küçük bir değer gir." };
      mealData = {
        ...validated.data, food_name: food.name.slice(0, 120).trim(), ...nutrition,
        food_id: origin === "catalog" ? food.id : null,
        grams_used: grams, nutrition_source: food.source,
        source_food_id: food.source_food_id, nutrition_source_url: food.source_url,
        nutrition_calculated: true,
      };
      nutritionStatus = "calculated";
    } else {
      if (input.manual_confirmed !== true) return { ok: false, message: "Besin değeri hesaplanmadı. Manuel kayıt için ayrıca onay ver." };
      mealData = { ...validated.data, food_id: null, grams_used: null, nutrition_source: null, source_food_id: null, nutrition_source_url: null, nutrition_calculated: false };
      nutritionStatus = [validated.data.calories, validated.data.protein_g, validated.data.carbs_g, validated.data.fat_g].every((value) => value !== null) ? "manual" : "unknown";
    }
    const result = id
      ? await supabase.from("meal_entries").update(mealData).eq("id", id).eq("user_id", user.id).select("id").maybeSingle()
      : await supabase.from("meal_entries").insert({ ...mealData, user_id: user.id }).select("id").maybeSingle();
    if (result.error || !result.data) {
      console.error("Meal save failed", result.error);
      return { ok: false, message: "Yemek kaydedilemedi. Bağlantını ve veritabanı kurulumunu kontrol edip tekrar dene." };
    }
    revalidatePath("/diary");
    revalidatePath("/home");
    return { ok: true, nutritionStatus };
  } catch (error) {
    console.error("Meal save request failed", error);
    return { ok: false, message: "Bağlantı kurulamadı. Tekrar dene." };
  }
}

export async function deleteMeal(id: string): Promise<Result> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { ok: false, message: "Geçersiz yemek kaydı." };
  try {
    const { supabase, user } = await authenticatedClient();
    if (!user) return { ok: false, message: "Oturumun sona erdi. Yeniden giriş yap." };
    const { data, error } = await supabase.from("meal_entries").delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
    if (error || !data) {
      console.error("Meal delete failed", error);
      return { ok: false, message: "Yemek silinemedi. Tekrar dene." };
    }
    revalidatePath("/diary");
    revalidatePath("/home");
    return { ok: true };
  } catch (error) {
    console.error("Meal delete request failed", error);
    return { ok: false, message: "Bağlantı kurulamadı. Tekrar dene." };
  }
}
