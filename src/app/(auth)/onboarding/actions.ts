"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseDecimal, parseGoalType, validateBirthDate } from "@/lib/auth/validation";

type Result = { ok: true } | { ok: false; message: string };
type Step = "basics" | "weight" | "goal" | "complete";

export async function saveOnboardingStep(step: Step, values: Record<string, unknown>): Promise<Result> {
  let update: Record<string, string | number | boolean> = {};

  if (step === "basics") {
    const birthDate = values.birthDate;
    const height = values.height;
    if (typeof birthDate !== "string" || typeof height !== "string") return { ok: false, message: "Temel bilgileri kontrol et." };
    const dateError = validateBirthDate(birthDate);
    if (dateError) return { ok: false, message: dateError };
    const parsedHeight = parseDecimal(height, "boy");
    if (parsedHeight.error || parsedHeight.value === undefined) return { ok: false, message: parsedHeight.error ?? "Geçerli bir boy değeri gir." };
    update = { birth_date: birthDate, height_cm: parsedHeight.value };
  } else if (step === "weight") {
    const currentWeight = values.currentWeight;
    const targetWeight = values.targetWeight;
    if (typeof currentWeight !== "string" || typeof targetWeight !== "string") return { ok: false, message: "Kilo bilgilerini kontrol et." };
    const current = parseDecimal(currentWeight, "kilo");
    const target = parseDecimal(targetWeight, "kilo");
    if (current.error || target.error || current.value === undefined || target.value === undefined) return { ok: false, message: "Geçerli bir kilo değeri gir." };
    update = { current_weight_kg: current.value, target_weight_kg: target.value };
  } else if (step === "goal") {
    const goal = typeof values.goal === "string" ? parseGoalType(values.goal) : null;
    if (!goal) return { ok: false, message: "Bir hedef seç." };
    update = { goal_type: goal };
  } else if (step !== "complete") {
    return { ok: false, message: "Geçersiz adım." };
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { ok: false, message: "Oturumun sona erdi. Yeniden giriş yap." };

    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("birth_date, height_cm, current_weight_kg, target_weight_kg, goal_type, onboarding_completed")
      .eq("id", user.id).single();
    if (profileError || !profile) {
      console.error("Onboarding profile lookup failed", profileError);
      return { ok: false, message: "Profilin yüklenemedi. Daha sonra tekrar dene." };
    }
    if (profile.onboarding_completed) return { ok: false, message: "Başlangıç adımları zaten tamamlandı." };
    if (step === "complete") {
      if (!profile.birth_date || profile.height_cm === null || profile.current_weight_kg === null || profile.target_weight_kg === null || !profile.goal_type) return { ok: false, message: "Önce tüm bilgilerini tamamla." };
      update = { onboarding_completed: true };
    }

    const { data, error } = await supabase.from("profiles").update(update).eq("id", user.id).select("id").single();
    if (error || !data) {
      console.error("Onboarding save failed", error);
      return { ok: false, message: "Bilgilerin kaydedilemedi. Tekrar dene." };
    }
    if (step === "complete") revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("Onboarding request failed", error);
    return { ok: false, message: "Bağlantı kurulamadı. Tekrar dene." };
  }
}
