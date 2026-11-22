"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MealEntry } from "@/lib/meals";

export function useMeals(date: string) {
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [loadedDate, setLoadedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Oturumun sona erdi. Yeniden giriş yap.");
        let { data, error: queryError } = await supabase.from("meal_entries")
          .select("id,user_id,meal_type,food_name,quantity,quantity_unit,calories,protein_g,carbs_g,fat_g,entry_date,created_at,food_id,grams_used,nutrition_source,source_food_id,nutrition_source_url,nutrition_calculated")
          .eq("user_id", user.id).eq("entry_date", date).order("created_at", { ascending: true });
        if (queryError?.code === "42703") {
          const legacy = await supabase.from("meal_entries")
            .select("id,user_id,meal_type,food_name,quantity,quantity_unit,calories,protein_g,carbs_g,fat_g,entry_date,created_at")
            .eq("user_id", user.id).eq("entry_date", date).order("created_at", { ascending: true });
          data = legacy.data?.map((entry) => ({ ...entry, food_id: null, grams_used: null, nutrition_source: null, source_food_id: null, nutrition_source_url: null, nutrition_calculated: false })) ?? null;
          queryError = legacy.error;
        }
        if (queryError) throw queryError;
        if (!cancelled) { setEntries((data ?? []) as MealEntry[]); setLoadedDate(date); }
      } catch (cause) {
        console.error("Meal list failed", cause);
        if (!cancelled) { setEntries([]); setLoadedDate(date); setError(cause instanceof Error && cause.message.startsWith("Oturumun") ? cause.message : "Öğünler yüklenemedi. Bağlantını ve veritabanı kurulumunu kontrol edip tekrar dene."); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [date, version]);

  return { entries: loadedDate === date ? entries : [], loading: loading || loadedDate !== date, error: loadedDate === date ? error : null, reload };
}
