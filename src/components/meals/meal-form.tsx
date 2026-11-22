"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { saveMeal } from "@/app/(app)/diary/actions";
import { calculateNutrition, gramsForQuantity, type FoodResult } from "@/lib/food-catalog";
import { mealLabels, mealTypes, type MealEntry, type MealType } from "@/lib/meals";
import { Button } from "@/components/ui/button";
import { FoodPicker } from "./food-picker";

type NutritionKey = "calories" | "protein_g" | "carbs_g" | "fat_g";
const nutrients: { key: NutritionKey; label: string; unit: string }[] = [
  { key: "calories", label: "Kalori", unit: "kcal" },
  { key: "protein_g", label: "Protein", unit: "g" },
  { key: "carbs_g", label: "Karbonhidrat", unit: "g" },
  { key: "fat_g", label: "Yağ", unit: "g" },
];
const per100 = { calories: "calories_per_100g", protein_g: "protein_per_100g", carbs_g: "carbs_per_100g", fat_g: "fat_per_100g" } as const;
const formatter = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });

export function MealForm({ date, mealType, editing, onClose, onSaved }: { date: string; mealType: MealType; editing: MealEntry | null; onClose: () => void; onSaved: (message: string, savedDate: string) => void }) {
  const [name, setName] = useState(editing?.food_name ?? "");
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [manual, setManual] = useState(!editing?.nutrition_calculated);
  const [quantity, setQuantity] = useState(editing?.quantity?.toString() ?? "");
  const [unit, setUnit] = useState(editing?.quantity_unit ?? "g");
  const [unitGrams, setUnitGrams] = useState(editing?.grams_used && editing.quantity ? String(editing.grams_used / editing.quantity) : "");
  const [chosenMeal, setChosenMeal] = useState<MealType>(editing?.meal_type ?? mealType);
  const [chosenDate, setChosenDate] = useState(editing?.entry_date ?? date);
  const [manualValues, setManualValues] = useState<Record<NutritionKey, string>>({
    calories: editing?.calories?.toString() ?? "", protein_g: editing?.protein_g?.toString() ?? "",
    carbs_g: editing?.carbs_g?.toString() ?? "", fat_g: editing?.fat_g?.toString() ?? "",
  });
  const [pending, setPending] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(Boolean(editing?.nutrition_calculated));
  const [error, setError] = useState<string | null>(null);
  const [manualConfirmationVisible, setManualConfirmationVisible] = useState(false);
  const [manualConfirmed, setManualConfirmed] = useState(false);

  useEffect(() => {
    document.getElementById("food-name")?.focus();
  }, []);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape" && !pending) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, pending]);
  useEffect(() => {
    if (!editing?.nutrition_calculated) return;
    const source = editing.food_id ? "catalog" : editing.nutrition_source === "Open Food Facts" ? "off" : "usda";
    const id = editing.food_id ?? editing.source_food_id;
    if (!id) {
      const timer = window.setTimeout(() => setSourceLoading(false), 0);
      return () => window.clearTimeout(timer);
    }
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/foods/detail?source=${source}&id=${encodeURIComponent(id)}`, { signal: controller.signal });
        const body = await response.json() as { food?: FoodResult };
        if (!response.ok || !body.food) throw new Error("Besin kaynağına ulaşılamadı.");
        if (!controller.signal.aborted) setSelected(body.food);
      } catch {
        if (!controller.signal.aborted) { setManual(true); setError("Kaynak verisi yüklenemedi. Kayıtlı değerleri manuel düzenleyebilirsin."); }
      } finally {
        if (!controller.signal.aborted) setSourceLoading(false);
      }
    })();
    return () => controller.abort();
  }, [editing]);

  const verifiedGrams = unit === "adet" ? selected?.piece_grams ?? null : unit === "porsiyon" ? selected?.portion_grams ?? null : null;
  const effectiveUnitGrams = unit === "g" ? null : unitGrams ? Number(unitGrams) : verifiedGrams;
  const grams = selected && !manual ? gramsForQuantity(Number(quantity), unit, effectiveUnitGrams) : null;
  const calculated = selected && grams !== null ? calculateNutrition(selected, grams) : null;

  const choose = useCallback((food: FoodResult) => {
    setSelected(food);
    setName(food.name.slice(0, 120));
    setManual(false);
    setUnit("g");
    setUnitGrams("");
    setError(null);
    setManualConfirmationVisible(false);
    setManualConfirmed(false);
  }, []);

  function switchToManual() {
    if (calculated) setManualValues({
      calories: calculated.calories?.toString() ?? "", protein_g: calculated.protein_g?.toString() ?? "",
      carbs_g: calculated.carbs_g?.toString() ?? "", fat_g: calculated.fat_g?.toString() ?? "",
    });
    setSelected(null);
    setManual(true);
    setManualConfirmationVisible(false);
    setManualConfirmed(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const auto = !manual ? selected : null;
    if (!auto && !manualConfirmed) {
      setManualConfirmationVisible(true);
      setError("Besin değeri hesaplanmadı. Arama sonucundan besin seç veya manuel kaydı ayrıca onayla.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const result = await saveMeal({
        food_name: name, meal_type: chosenMeal, entry_date: chosenDate,
        quantity, quantity_unit: quantity ? unit : "",
        calories: auto ? "" : manualValues.calories, protein_g: auto ? "" : manualValues.protein_g,
        carbs_g: auto ? "" : manualValues.carbs_g, fat_g: auto ? "" : manualValues.fat_g,
        food_origin: auto?.origin, food_reference: auto ? auto.origin === "catalog" ? auto.id : auto.source_food_id : null,
        grams_per_unit: auto && unit !== "g" ? unitGrams || verifiedGrams : null,
        manual_confirmed: !auto && manualConfirmed,
      }, editing?.id);
      if (!result.ok) { setError(result.message); return; }
      const action = editing ? "güncellendi" : "kaydedildi";
      const message = result.nutritionStatus === "calculated" ? `Yemek hesaplanan besin değerleriyle ${action}.` : result.nutritionStatus === "manual" ? `Yemek manuel besin değerleriyle ${action}.` : `Yemek ${action}; besin değerleri bilinmiyor.`;
      onSaved(message, chosenDate);
    } catch {
      setError("Yemek kaydedilemedi. Tekrar dene.");
    } finally { setPending(false); }
  }

  return <div className="meal-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
    <section className="meal-modal" role="dialog" aria-modal="true" aria-labelledby="meal-dialog-title">
      <div className="meal-modal-heading"><div><span className="eyebrow">BESLENME GÜNLÜĞÜ</span><h2 id="meal-dialog-title">{editing ? "Yemeği düzenle" : "Yemek ekle"}</h2></div><button type="button" className="icon-button" onClick={onClose} disabled={pending} aria-label="Kapat"><X size={20} /></button></div>
      <p className="meal-form-hint">Otomatik hesaplama için arama sonucundan besin seç. Manuel kayıt ayrıca onay gerektirir.</p>
      <form className="meal-form" onSubmit={(event) => void submit(event)}>
        {sourceLoading ? <p className="food-search-note" role="status">Besin kaynağı yükleniyor...</p> : <FoodPicker name={name} selected={selected} onName={(value) => { setName(value); setSelected(null); setManual(true); setManualConfirmationVisible(false); setManualConfirmed(false); if (selected) setManualValues({ calories: "", protein_g: "", carbs_g: "", fat_g: "" }); }} onSelect={choose} />}
        {!selected && name.trim().length >= 2 && Object.values(manualValues).every((value) => !value.trim()) && <p className="food-manual-notice">Otomatik hesaplama için arama sonucundan bir besin seç. Yalnızca adı kaydedersen besin değerleri bilinmiyor kalır.</p>}
        {selected && !manual && <div className="nutrition-source-panel"><strong>100 g için kaynak değerleri</strong><p>{nutrients.map(({ key, label, unit: metricUnit }) => `${label}: ${selected[per100[key]] === null ? "bilinmiyor" : `${selected[per100[key]]} ${metricUnit}`}`).join(" · ")}</p></div>}
        <div className="meal-form-grid"><label className="field"><span>Miktar / porsiyon</span><input className="input" name="quantity" type="number" min="0.01" max="100000" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Örn. 100" required={Boolean(selected && !manual)} /></label><label className="field"><span>Birim</span><select className="input" name="quantity_unit" value={unit} onChange={(event) => { setUnit(event.target.value); setUnitGrams(""); }}><option value="g">gram</option>{(!selected || manual || selected.piece_grams !== null) && <option value="adet">adet</option>}{(!selected || manual || selected.portion_grams !== null) && <option value="porsiyon">porsiyon</option>}{(!selected || manual) && <><option value="ml">ml</option><option value="dilim">dilim</option><option value="kase">kase</option></>}</select></label></div>
        {selected && !manual && unit !== "g" && verifiedGrams !== null && <label className="field"><span>1 {unit} için gram karşılığı ({unit === "adet" ? selected.piece_label : selected.portion_label}: {formatter.format(verifiedGrams)} g)</span><input className="input" type="number" min="0.01" max="100000" step="0.01" value={unitGrams || String(verifiedGrams)} onChange={(event) => setUnitGrams(event.target.value)} /><small>Kaynak gram karşılığını düzenlersen hesaplama seçtiğin değere göre yapılır.</small></label>}
        <div className="meal-form-grid"><label className="field"><span>Öğün</span><select className="input" name="meal_type" value={chosenMeal} onChange={(event) => setChosenMeal(event.target.value as MealType)}>{mealTypes.map((type) => <option value={type} key={type}>{mealLabels[type]}</option>)}</select></label><label className="field"><span>Tarih</span><input className="input" name="entry_date" type="date" required value={chosenDate} onChange={(event) => setChosenDate(event.target.value)} min="1900-01-01" max="2100-12-31" /></label></div>
        {selected && !manual ? <div className="nutrition-preview" aria-live="polite"><strong>Hesaplanan besin değerleri {grams !== null && `· ${formatter.format(grams)} g`}</strong><div>{nutrients.map(({ key, label, unit: metricUnit }) => <span key={key}><small>{label}</small><b>{calculated?.[key] === null || calculated?.[key] === undefined ? "Bilinmiyor" : `${formatter.format(calculated[key]!)} ${metricUnit}`}</b></span>)}</div><p>Bu değerler {selected.source} verilerine dayalı tahmindir; ürün ve hazırlama biçimine göre değişebilir.</p></div> : <div className="meal-form-grid nutrition-grid">{nutrients.map(({ key, label, unit: metricUnit }) => <label className="field" key={key}><span>{label} ({metricUnit})</span><input className="input" name={key} type="number" min="0" max={key === "calories" ? 100000 : 10000} step="0.01" value={manualValues[key]} onChange={(event) => setManualValues((values) => ({ ...values, [key]: event.target.value }))} placeholder="Bilinmiyor" /></label>)}</div>}
        {selected && calculated && nutrients.some(({ key }) => calculated[key] === null) && <p className="food-manual-notice" role="alert">Seçilen besinin kalori veya makro değerleri eksik. Tam değerli başka bir besin seç veya manuel girişe geç.</p>}
        {selected && !manual && <button type="button" className="food-manual-link" onClick={switchToManual}>Değerleri manuel düzenle</button>}
        {!selected && manualConfirmationVisible && <label className="food-manual-confirm"><input type="checkbox" checked={manualConfirmed} onChange={(event) => setManualConfirmed(event.target.checked)} /><span>Besin değeri hesaplanmadığını anladım; manuel değerlerle veya bilinmiyor olarak kaydetmeyi onaylıyorum.</span></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="meal-form-actions"><Button type="button" variant="secondary" onClick={onClose} disabled={pending}>Vazgeç</Button><Button type="submit" disabled={pending || sourceLoading || Boolean(selected && !manual && !calculated)}>{pending ? "Kaydediliyor..." : "Kaydet"}</Button></div>
      </form>
    </section>
  </div>;
}
