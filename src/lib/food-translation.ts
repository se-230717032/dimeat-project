import "server-only";
import { normalizeFoodName } from "@/lib/food-catalog";

// Search terms only. Nutrient values always come from the named food source.
const commonTerms: Record<string, string> = {
  "kofte": "meatballs", "izgara kofte": "grilled meatballs", "tavuk": "chicken",
  "tavuk gogsu": "chicken breast", "yumurta": "egg", "haslanmis yumurta": "boiled egg",
  "makarna": "pasta", "pirinc": "rice", "pilav": "cooked rice", "pirinc pilavi": "cooked rice",
  "bulgur": "bulgur", "bulgur pilavi": "cooked bulgur", "mercimek": "lentils",
  "mercimek corbasi": "lentil soup", "ezogelin corbasi": "ezogelin soup",
  "yogurt": "yogurt", "elma": "apple", "muz": "banana", "somon": "salmon",
  "patates": "potato", "peynir": "cheese", "ekmek": "bread", "sut": "milk",
  "yulaf": "oats", "kuru fasulye": "white beans", "nohut": "chickpeas",
  "nohut yemegi": "chickpea stew", "menemen": "menemen", "dolma": "stuffed vegetables",
  "sarma": "stuffed grape leaves", "manti": "manti", "borek": "borek",
  "simit": "simit", "ayran": "ayran", "cacik": "cacik", "sutlac": "rice pudding",
  "baklava": "baklava", "tavuk sote": "sauteed chicken", "et sote": "sauteed beef",
  "patates yemegi": "potato stew", "salatalik": "cucumber", "domates": "tomato",
  "marul": "lettuce", "havuç": "carrot", "havuc": "carrot", "sogan": "onion",
  "sarmisak": "garlic", "biber": "pepper", "patlican": "eggplant", "kabak": "zucchini",
  "ispanak": "spinach", "brokoli": "broccoli", "karnabahar": "cauliflower",
  "bezelye": "peas", "misir": "corn", "mantar": "mushroom", "avokado": "avocado",
  "cilek": "strawberry", "portakal": "orange", "armut": "pear", "uzum": "grapes",
  "karpuz": "watermelon", "kavun": "melon", "seftali": "peach", "erik": "plum",
  "kayisi": "apricot", "incir": "fig", "hurma": "dates", "limon": "lemon",
  "ceviz": "walnuts", "badem": "almonds", "findik": "hazelnuts", "fistik": "pistachios",
  "yer fistigi": "peanuts", "tahin": "tahini", "zeytin": "olives", "zeytinyagi": "olive oil",
  "tereyagi": "butter", "bal": "honey", "recel": "jam", "seker": "sugar",
  "un": "flour", "kek": "cake", "biskuvi": "cookies", "cikolata": "chocolate",
  "dondurma": "ice cream", "kahve": "coffee", "cay": "tea", "su": "water",
  "dana eti": "beef", "kiyma": "ground beef", "kuzu eti": "lamb",
  "hindi": "turkey", "balik": "fish", "ton baligi": "tuna", "karides": "shrimp",
  "sucuk": "sucuk", "sosis": "sausage", "jambon": "ham", "pastirma": "pastirma",
};

const translations = new Map<string, { until: number; english: string | null }>();
const knownEnglish = new Set(Object.values(commonTerms).map(normalizeFoodName));
const localAliases = new Map<string, string>();
for (const [turkish, english] of Object.entries(commonTerms)) {
  if (!localAliases.has(normalizeFoodName(english))) localAliases.set(normalizeFoodName(english), turkish);
}

export function turkishFoodTerm(query: string) {
  return localAliases.get(normalizeFoodName(query)) ?? null;
}
const foodDescription = /food|dish|soup|stew|fruit|vegetable|meat|fish|bread|cheese|grain|beverage|drink|dessert|cuisine|edible|legume|pastry|pudding/i;

export async function englishFoodTerm(query: string): Promise<string | null> {
  const normalized = normalizeFoodName(query);
  if (commonTerms[normalized]) return commonTerms[normalized];
  if (knownEnglish.has(normalized)) return null;
  const cached = translations.get(normalized);
  if (cached && cached.until > Date.now()) return cached.english;
  if (normalized.length < 4) return null;
  try {
    const url = new URL("https://www.wikidata.org/w/api.php");
    for (const [key, value] of Object.entries({ action: "wbsearchentities", search: query, language: "tr", uselang: "en", type: "item", limit: "5", format: "json", maxlag: "5" })) url.searchParams.set(key, value);
    const response = await fetch(url, { headers: { "User-Agent": "Dimeat/0.1 (food name search)" }, signal: AbortSignal.timeout(3500) });
    if (!response.ok) return null;
    const body = await response.json() as { search?: { label?: string; description?: string; match?: { language?: string; text?: string } }[] };
    const matches = (body.search ?? []).filter((item) => item.match?.language === "tr" && normalizeFoodName(item.match.text ?? "") === normalized && foodDescription.test(item.description ?? "") && item.label && normalizeFoodName(item.label) !== normalized);
    const english = matches.length === 1 ? matches[0].label! : null;
    translations.set(normalized, { english, until: Date.now() + 24 * 60 * 60 * 1000 });
    return english;
  } catch {
    return null;
  }
}
