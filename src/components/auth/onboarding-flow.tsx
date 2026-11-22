"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Heart, Scale, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { parseDecimal, validateBirthDate } from "@/lib/auth/validation";
import type { GoalType, OnboardingFields } from "@/types/profile";
import { saveOnboardingStep } from "@/app/(auth)/onboarding/actions";

const steps = ["Hoş geldin", "Temel bilgiler", "Kilo", "Hedef", "Tamamlandı"];
const goals: { value: GoalType; label: string; description: string }[] = [
  { value: "lose", label: "Kilo vermek", description: "Kendi belirlediğin hedefe ilerle." },
  { value: "maintain", label: "Kiloyu korumak", description: "Mevcut düzenini sürdür." },
  { value: "gain", label: "Kilo almak", description: "Kendi belirlediğin hedefe ilerle." },
];

function startingStep(profile: OnboardingFields) {
  if (!profile.birth_date || profile.height_cm === null) return 0;
  if (profile.current_weight_kg === null || profile.target_weight_kg === null) return 2;
  if (!profile.goal_type) return 3;
  return 4;
}

export function OnboardingFlow({ username, profile }: { username: string; profile: OnboardingFields }) {
  const router = useRouter();
  const [step, setStep] = useState(startingStep(profile));
  const [birthDate, setBirthDate] = useState(profile.birth_date ?? "");
  const [height, setHeight] = useState(profile.height_cm?.toString() ?? "");
  const [currentWeight, setCurrentWeight] = useState(profile.current_weight_kg?.toString() ?? "");
  const [targetWeight, setTargetWeight] = useState(profile.target_weight_kg?.toString() ?? "");
  const [goal, setGoal] = useState<GoalType | null>(profile.goal_type);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);

  function next() {
    if (busy.current) return;
    setMessage(null);
    if (step === 0) { setStep(1); return; }

    let action: "basics" | "weight" | "goal" | "complete";
    let values: Record<string, unknown> = {};
    if (step === 1) {
      const dateError = validateBirthDate(birthDate);
      const heightError = parseDecimal(height, "boy").error;
      if (dateError || heightError) { setMessage(dateError ?? heightError ?? null); return; }
      action = "basics";
      values = { birthDate, height };
    } else if (step === 2) {
      if (parseDecimal(currentWeight, "kilo").error || parseDecimal(targetWeight, "kilo").error) { setMessage("Geçerli bir kilo değeri gir."); return; }
      action = "weight";
      values = { currentWeight, targetWeight };
    } else if (step === 3) {
      if (!goal) { setMessage("Bir hedef seç."); return; }
      action = "goal";
      values = { goal };
    } else {
      action = "complete";
    }

    busy.current = true;
    startTransition(async () => {
      try {
        const result = await saveOnboardingStep(action, values);
        if (!result.ok) { setMessage(result.message); return; }
        if (action === "complete") { router.replace("/home"); router.refresh(); return; }
        setStep((value) => Math.min(value + 1, 4));
      } catch (error) {
        console.error("Onboarding action failed", error);
        setMessage("Bağlantı kurulamadı. Tekrar dene.");
      } finally {
        busy.current = false;
      }
    });
  }

  return <div className="onboarding-card">
    <div className="onboarding-top"><span className="eyebrow">KENDİ RİTMİNDE BAŞLA</span><LogoutButton compact /></div>
    <div className="step-meta"><span>Adım {step + 1} / {steps.length}</span><span>{steps[step]}</span></div>
    <div className="step-track" aria-label={`Adım ${step + 1} / ${steps.length}`}><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
    {step === 0 && <div className="onboarding-content"><span className="onboarding-icon"><Sparkles size={26} aria-hidden="true" /></span><h1>Dimeat&apos;e hoş geldin, {username}</h1><p>Beslenmeni ve sana iyi gelen alışkanlıkları kendi hızında takip edebileceğin bir alan hazırlıyoruz. Birkaç kısa adımla başlayalım.</p></div>}
    {step === 1 && <div className="onboarding-content"><span className="onboarding-icon"><Heart size={26} aria-hidden="true" /></span><h1>Önce seni tanıyalım</h1><p>Bu bilgiler yalnızca senin profilinde saklanır.</p><div className="onboarding-fields"><Input id="birthDate" label="Doğum tarihi" type="date" max={new Date().toISOString().slice(0, 10)} value={birthDate} onChange={(event) => setBirthDate(event.target.value)} required /><Input id="height" label="Boy (cm)" type="number" inputMode="decimal" min="50" max="300" step="0.01" placeholder="Örn. 170" value={height} onChange={(event) => setHeight(event.target.value)} required /></div></div>}
    {step === 2 && <div className="onboarding-content"><span className="onboarding-icon"><Scale size={26} aria-hidden="true" /></span><h1>Kilo bilgilerin</h1><p>Burada yalnızca kendi girdiğin değerleri kaydediyoruz.</p><div className="onboarding-fields"><Input id="currentWeight" label="Mevcut kilo (kg)" type="number" inputMode="decimal" min="0.01" max="700" step="0.01" placeholder="Örn. 72.5" value={currentWeight} onChange={(event) => setCurrentWeight(event.target.value)} required /><Input id="targetWeight" label="Hedef kilo (kg)" type="number" inputMode="decimal" min="0.01" max="700" step="0.01" placeholder="Örn. 68.5" value={targetWeight} onChange={(event) => setTargetWeight(event.target.value)} required /></div></div>}
    {step === 3 && <div className="onboarding-content"><span className="onboarding-icon"><Heart size={26} aria-hidden="true" /></span><h1>Hedefin ne?</h1><p>Hedefini istediğin gibi belirle. Dimeat senin tercihlerini takip eder.</p><fieldset className="goal-list"><legend className="sr-only">Hedef türü</legend>{goals.map((item) => <label className={`goal-option ${goal === item.value ? "selected" : ""}`} key={item.value}><input type="radio" name="goal" value={item.value} checked={goal === item.value} onChange={() => setGoal(item.value)} /><span><strong>{item.label}</strong><small>{item.description}</small></span><span className="goal-check">{goal === item.value && <Check size={15} aria-hidden="true" />}</span></label>)}</fieldset></div>}
    {step === 4 && <div className="onboarding-content"><span className="onboarding-icon"><Check size={26} aria-hidden="true" /></span><h1>Her şey hazır</h1><p>Başlamak için hazırsın. Kendi ritminde ilerleyebilir, bilgilerini daha sonra güncelleyebilirsin.</p></div>}
    {message && <p className="form-error" role="alert">{message}</p>}
    <div className="onboarding-actions">{step > 0 && <Button type="button" variant="secondary" disabled={pending} onClick={() => { setMessage(null); setStep((value) => value - 1); }}><ArrowLeft size={16} aria-hidden="true" /> Geri</Button>}<Button type="button" disabled={pending} onClick={next}>{pending ? "Kaydediliyor..." : step === 4 ? "Başlayalım" : "Devam et"}{!pending && step < 4 && <ArrowRight size={16} aria-hidden="true" />}</Button></div>
    <p className="onboarding-disclaimer">Dimeat tıbbi teşhis veya tedavi sunmaz.</p>
  </div>;
}
