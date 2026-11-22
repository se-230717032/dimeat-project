"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteMeal } from "@/app/(app)/diary/actions";
import { daySummary, isValidDate, localDate, mealLabels, mealTypes, type MealEntry, type MealType } from "@/lib/meals";
import { useMeals } from "./use-meals";
import { Button } from "@/components/ui/button";
import { MealForm } from "./meal-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

const formatter = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
function metric(value: { value: number; known: boolean; incomplete: boolean }, unit: string) {
  return `${value.known ? `${formatter.format(value.value)} ${unit}` : "Bilinmiyor"}${value.incomplete && value.known ? " · eksik" : ""}`;
}
function entryMetric(value: number | null) {
  return value === null ? "Bilinmiyor" : `${formatter.format(value)} g`;
}

function shiftDay(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  return localDate(new Date(year, month - 1, day + days));
}

export function DiaryView({ initialMeal }: { initialMeal?: string }) {
  const [date, setDate] = useState("");
  const [form, setForm] = useState<{ mealType: MealType; editing: MealEntry | null } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { entries, loading, error, reload } = useMeals(date);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDate(localDate());
      if (initialMeal && mealTypes.includes(initialMeal as MealType)) setForm({ mealType: initialMeal as MealType, editing: null });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [initialMeal]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  const summary = daySummary(entries);
  const today = localDate();

  async function remove(entry: MealEntry) {
    if (!window.confirm(`“${entry.food_name}” kaydını silmek istiyor musun?`)) return;
    setActionError(null);
    setDeleting(entry.id);
    const result = await deleteMeal(entry.id);
    setDeleting(null);
    if (!result.ok) { setActionError(result.message); return; }
    setToast("Yemek silindi.");
    reload();
  }

  return <div className="diary-page">
    <PageHeader eyebrow="BESLENME GÜNLÜĞÜ" title="Günlüğüm" description="Besin seçerek otomatik hesapla; manuel kayıtta eksik değerleri açıkça gör." />
    <div className="diary-toolbar"><div className="date-picker"><button type="button" className="icon-button" onClick={() => setDate(shiftDay(date || today, -1))} aria-label="Önceki gün"><ChevronLeft size={19} /></button><label className="date-input-label"><CalendarDays size={17} aria-hidden="true" /><span className="sr-only">Gün seç</span><input type="date" value={date} min="1900-01-01" max="2100-12-31" onChange={(event) => { if (isValidDate(event.target.value)) setDate(event.target.value); }} /></label><button type="button" className="icon-button" onClick={() => setDate(shiftDay(date || today, 1))} aria-label="Sonraki gün"><ChevronRight size={19} /></button></div><div className="diary-toolbar-actions"><button type="button" className="button button-secondary" onClick={() => setDate(today)}>Bugün</button><Button type="button" onClick={() => setForm({ mealType: "breakfast", editing: null })}><Plus size={17} /> Yemek ekle</Button></div></div>
    {toast && <div className="meal-toast" role="status">{toast}</div>}
    {actionError && <p className="form-error" role="alert">{actionError}</p>}
    {error && <div className="meal-load-error" role="alert"><p>{error}</p><Button type="button" variant="secondary" onClick={reload}>Yeniden dene</Button></div>}
    {loading || !date ? <div className="meal-skeleton-grid" aria-label="Öğünler yükleniyor">{mealTypes.map((type) => <div key={type} className="meal-skeleton" />)}</div> : !error && <>
      <div className="diary-summary card"><div className="section-top"><div><span className="eyebrow">SEÇİLEN GÜN</span><h2>Günlük özet</h2></div><span className="summary-symbol"><CalendarDays size={19} /></span></div><div className="diary-summary-grid"><div><strong>{summary.foods}</strong><small>Yemek</small></div><div><strong>{summary.meals}/4</strong><small>Kayıtlı öğün</small></div><div><strong>{metric(summary.calories, "kcal")}</strong><small>Bilinen kalori</small></div><div><strong>{metric(summary.protein, "g")}</strong><small>Protein</small></div><div><strong>{metric(summary.carbs, "g")}</strong><small>Karbonhidrat</small></div><div><strong>{metric(summary.fat, "g")}</strong><small>Yağ</small></div></div>{entries.length > 0 && [summary.calories, summary.protein, summary.carbs, summary.fat].some((item) => item.incomplete) && <p className="summary-footnote">Bazı besin değerleri bilinmiyor; toplamlar yalnızca girilen değerleri içerir.</p>}</div>
      {entries.length === 0 && <div className="diary-empty card"><h2>Henüz öğün eklemedin</h2><p>İlk öğününü kaydederek başlayabilirsin.</p></div>}
      <div className="diary-meal-grid">{mealTypes.map((type) => {
        const items = entries.filter((entry) => entry.meal_type === type);
        return <Card className="diary-meal-card" key={type}><div className="diary-meal-heading"><div><span className={`meal-icon ${({ breakfast: "peach", lunch: "sage", dinner: "lavender", snack: "butter" })[type]}`} aria-hidden="true">{({ breakfast: "☀", lunch: "◒", dinner: "☾", snack: "✦" })[type]}</span><div><h2>{mealLabels[type]}</h2><small>{items.length ? `${items.length} yemek` : "Henüz kayıt yok"}</small></div></div><button type="button" className="icon-button meal-plus" onClick={() => setForm({ mealType: type, editing: null })} aria-label={`${mealLabels[type]} için yemek ekle`}><Plus size={18} /></button></div><div className="diary-food-list">{items.map((entry) => <div className="diary-food" key={entry.id}><div><strong>{entry.food_name}</strong><small>{entry.quantity !== null ? `${formatter.format(entry.quantity)} ${entry.quantity_unit} · ` : ""}{entry.calories === null ? "Kalori bilinmiyor" : `${formatter.format(entry.calories)} kcal`}</small><small className="diary-food-macros">Protein: {entryMetric(entry.protein_g)} · Karbonhidrat: {entryMetric(entry.carbs_g)} · Yağ: {entryMetric(entry.fat_g)}</small>{entry.nutrition_calculated && entry.nutrition_source_url && <small className="food-source-line">Kaynaklı tahmin · <a href={entry.nutrition_source_url} target="_blank" rel="noopener noreferrer">{entry.nutrition_source}</a>{entry.nutrition_source === "Open Food Facts" && <> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">ODbL</a></>}</small>}</div><div className="diary-food-actions"><button type="button" className="icon-button" onClick={() => setForm({ mealType: type, editing: entry })} aria-label={`${entry.food_name} düzenle`}><Pencil size={16} /></button><button type="button" className="icon-button destructive" onClick={() => void remove(entry)} disabled={deleting === entry.id} aria-label={`${entry.food_name} sil`}><Trash2 size={16} /></button></div></div>)}</div></Card>;
      })}</div>
    </>}
    {form && date && <MealForm key={form.editing?.id ?? `${form.mealType}-${date}`} date={date} mealType={form.mealType} editing={form.editing} onClose={() => setForm(null)} onSaved={(message, savedDate) => { setForm(null); setDate(savedDate); setToast(message); reload(); }} />}
  </div>;
}
