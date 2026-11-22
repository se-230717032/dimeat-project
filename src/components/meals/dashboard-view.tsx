"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Quote, Sparkles, Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { daySummary, localDate, mealLabels, mealTypes } from "@/lib/meals";
import { useMeals } from "./use-meals";

const mealStyle = {
  breakfast: { tint: "peach", icon: "☀" },
  lunch: { tint: "sage", icon: "◒" },
  dinner: { tint: "lavender", icon: "☾" },
  snack: { tint: "butter", icon: "✦" },
} as const;
const formatter = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });

function metric(value: { value: number; known: boolean; incomplete: boolean }, unit: string) {
  return `${value.known ? `${formatter.format(value.value)} ${unit}` : "Bilinmiyor"}${value.incomplete && value.known ? " · eksik" : ""}`;
}

export function DashboardView({ username }: { username: string }) {
  const [today, setToday] = useState("");
  useEffect(() => {
    const timeout = window.setTimeout(() => setToday(localDate()), 0);
    return () => window.clearTimeout(timeout);
  }, []);
  const { entries, loading, error, reload } = useMeals(today);
  const summary = daySummary(entries);
  const progress = summary.meals / 4 * 100;
  const hasMissingNutrition = [summary.calories, summary.protein, summary.carbs, summary.fat].some((item) => item.incomplete);

  return <div className="dashboard">
    <div className="dashboard-top"><span className="eyebrow">BUGÜNÜN YOLCULUĞU</span><span className="today-pill"><span className="status-dot" />Kendine iyi bak</span></div>
    <PageHeader title={`Merhaba, ${username} 👋`} description="Öğünlerini kendi ritminde kaydet. Bugünün notları burada birikir." />
    <div className="dashboard-grid"><div className="dashboard-main">
      <Card className="summary-card"><div className="section-top"><div><span className="eyebrow">GÜNLÜK ÖZET</span><h2>Bugüne bir bakış</h2></div><span className="summary-symbol"><Sparkles size={20} aria-hidden="true" /></span></div>
        {loading || !today ? <div className="dashboard-loading" aria-label="Bugünkü öğünler yükleniyor" /> : error ? <div className="meal-load-error" role="alert"><p>{error}</p><button type="button" className="button button-secondary" onClick={reload}>Yeniden dene</button></div> : <>
          <div className="daily-calories"><small>BUGÜN ALINAN KALORİ</small><strong>{metric(summary.calories, "kcal")}</strong><span>{summary.foods} yemek · {summary.meals}/4 öğün</span></div>
          <div className="daily-macros" aria-label="Günlük besin toplamları">
            <div><small>Protein</small><strong>{metric(summary.protein, "g")}</strong></div>
            <div><small>Karbonhidrat</small><strong>{metric(summary.carbs, "g")}</strong></div>
            <div><small>Yağ</small><strong>{metric(summary.fat, "g")}</strong></div>
          </div>
          <div className="progress-track" aria-label={`Dört öğünden ${summary.meals} tanesinde kayıt var`}><span style={{ width: `${progress}%` }} /></div>
          <p className="summary-footnote">{hasMissingNutrition ? "Bazı besin değerleri bilinmiyor; toplamlar yalnızca bilinen değerleri içerir." : summary.foods ? "Bugünkü öğünlerin günlüğünde kayıtlı." : "Henüz öğün eklemedin. İlk öğününü kaydederek başlayabilirsin."}</p>
        </>}
      </Card>
      <div className="section-heading"><div><span className="eyebrow">BESLENME GÜNLÜĞÜ</span><h2>Öğünlerin</h2></div><Link href="/diary" className="text-link">Günlüğe git <ArrowRight size={16} aria-hidden="true" /></Link></div>
      <div className="meal-grid">{mealTypes.map((type) => {
        const items = entries.filter((entry) => entry.meal_type === type);
        return <Card key={type} className="meal-card"><span className={`meal-icon ${mealStyle[type].tint}`} aria-hidden="true">{mealStyle[type].icon}</span><div><h3>{mealLabels[type]}</h3><p>{loading ? "Yükleniyor..." : error ? "Kayıt durumu bilinmiyor" : items.length ? `${items.length} yemek kaydedildi` : "Henüz kayıt yok"}</p>{!loading && !error && items.length > 0 && <ul className="home-meal-items">{items.map((entry) => <li key={entry.id}><span>{entry.food_name}</span><strong>{entry.calories === null ? "Kalori bilinmiyor" : `${formatter.format(entry.calories)} kcal`}</strong></li>)}</ul>}</div><Link href={`/diary?meal=${type}`} className="meal-add" aria-label={`${mealLabels[type]} için yemek ekle`}><Plus size={17} /></Link></Card>;
      })}</div>
    </div><div className="dashboard-side">
      <Card className="habits-card"><div className="section-top"><div><span className="eyebrow">RUTİNLERİN</span><h2>Alışkanlıkların</h2></div><Link href="/habits" className="circle-link" aria-label="Alışkanlıklara git"><ArrowRight size={17} /></Link></div><p className="habit-coming">Alışkanlık takibi yakında burada olacak.</p></Card>
      <Card className="quote-card"><Quote size={25} strokeWidth={1.5} aria-hidden="true" /><span className="eyebrow">GÜNÜN SÖZÜ</span><blockquote>İyi hissetmek, kendine gösterdiğin küçük özenlerle başlar.</blockquote><span className="quote-dash" /></Card>
      <div className="side-note"><Utensils size={18} aria-hidden="true" /><p>Kendi ritminde ilerle. Dimeat her adımda yanında.</p></div>
    </div></div>
  </div>;
}
