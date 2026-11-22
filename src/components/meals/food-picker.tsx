"use client";

import { useEffect, useState } from "react";
import { normalizeFoodName, type FoodResult } from "@/lib/food-catalog";

function unambiguousMatch(query: string, foods: FoodResult[]) {
  if (foods.length !== 1 || foods[0].origin !== "catalog") return null;
  const food = foods[0];
  const name = normalizeFoodName(food.name);
  const term = normalizeFoodName(query);
  if (!term || name !== term) return null;
  if ([food.calories_per_100g, food.protein_per_100g, food.carbs_per_100g, food.fat_per_100g].some((value) => value === null)) return null;
  return food;
}

export function FoodPicker({ name, selected, onName, onSelect }: { name: string; selected: FoodResult | null; onName: (value: string) => void; onSelect: (food: FoodResult) => void }) {
  const [results, setResults] = useState<FoodResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [translatedQuery, setTranslatedQuery] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"catalog" | "usda" | "off">("catalog");

  useEffect(() => {
    if (selected || searchMode !== "catalog" || name.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/foods/search?q=${encodeURIComponent(name.trim())}`, { signal: controller.signal });
        const body = await response.json() as { foods?: FoodResult[]; error?: string; warnings?: string[]; translatedQuery?: string | null };
        if (!response.ok) throw new Error(body.error ?? "Arama yapılamadı.");
        if (controller.signal.aborted) return;
        const foods = body.foods ?? [];
        setWarnings(body.warnings ?? []);
        setTranslatedQuery(body.translatedQuery ?? null);
        const match = unambiguousMatch(name, foods);
        if (match) onSelect(match);
        else setResults(foods);
        if (!foods.length) setError("Katalog ve USDA’da güvenilir eşleşme bulunamadı. Besini manuel girebilir veya paketli ürün arayabilirsin.");
      } catch (cause) {
        if (!controller.signal.aborted) { setResults([]); setError(cause instanceof Error ? cause.message : "Arama yapılamadı."); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 650);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [name, selected, searchMode, onSelect]);

  async function external(source: "usda" | "off") {
    if (name.trim().length < 2) return;
    setSearchMode(source);
    setLoading(true);
    setError(null);
    setWarnings([]);
    try {
      const response = await fetch(`/api/foods/search?source=${source}&q=${encodeURIComponent(name.trim())}`);
      const body = await response.json() as { foods?: FoodResult[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Arama yapılamadı.");
      setResults(body.foods ?? []);
      if (!body.foods?.length) setError("Sonuç bulunamadı. Besin değerlerini manuel girebilirsin.");
    } catch (cause) {
      setResults([]);
      setError(cause instanceof Error ? cause.message : "Arama yapılamadı. Manuel giriş yapabilirsin.");
    } finally { setLoading(false); }
  }

  async function choose(food: FoodResult) {
    if (food.origin === "usda") {
      setLoading(true);
      try {
        const response = await fetch(`/api/foods/detail?source=usda&id=${encodeURIComponent(food.source_food_id)}`);
        const body = await response.json() as { food?: FoodResult; error?: string };
        if (!response.ok || !body.food) throw new Error(body.error ?? "Besin yüklenemedi.");
        onSelect(body.food);
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Besin yüklenemedi."); }
      finally { setLoading(false); }
    } else onSelect(food);
    setResults([]);
  }

  return <div className="food-picker">
    <label className="field" htmlFor="food-name"><span>Yemek adı *</span><input id="food-name" className="input" name="food_name" value={name} onChange={(event) => { onName(event.target.value); setSearchMode("catalog"); setResults([]); setError(null); setWarnings([]); setTranslatedQuery(null); }} required maxLength={120} autoComplete="off" placeholder="Örn. yumurta" /></label>
    {selected ? <p className="food-selected" role="status"><strong>Katalogdan seçildi: {selected.name}</strong> · Kaynak: <a href={selected.source_url} target="_blank" rel="noopener noreferrer">{selected.source}</a>{selected.source === "Open Food Facts" && <> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">ODbL</a></>}</p> : <>
      <p className="food-selection-missing" role="status">Katalogdan besin seçilmedi. Adı yazdıktan sonra arama sonucunu seç.</p>
      {loading && <p className="food-search-note" role="status">Besinler aranıyor...</p>}
      {error && <p className="food-search-note" role="status">{error}</p>}
      {translatedQuery && <p className="food-search-note">İngilizce arama karşılığı: {translatedQuery}. Sonuçlarda kaynak adı gösterilir.</p>}
      {warnings.map((warning) => <p className="food-search-note" role="status" key={warning}>{warning}</p>)}
      {results.length > 0 && <ul className="food-results" aria-label="Besin arama sonuçları">{results.map((food) => <li key={food.id}><button type="button" onClick={() => void choose(food)}><strong>{food.name}</strong><small>{food.source} · 100 g için {food.calories_per_100g === null ? "kalori bilinmiyor" : `${food.calories_per_100g} kcal`}</small></button></li>)}</ul>}
      <div className="food-external-actions"><button type="button" onClick={() => void external("usda")} disabled={loading || name.trim().length < 2}>USDA’da ara</button><button type="button" onClick={() => void external("off")} disabled={loading || name.trim().length < 2}>Paketli ürünü ara</button></div>
      <p className="food-search-note">Yerel katalog ve USDA otomatik aranır. Paketli ürün araması Open Food Facts verilerini ve ODbL lisansını kullanır.</p>
    </>}
  </div>;
}
