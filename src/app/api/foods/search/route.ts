import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeFoodName } from "@/lib/food-catalog";
import { catalogFoods, offSearch, usdaSearch } from "@/lib/food-sources";
import { englishFoodTerm, turkishFoodTerm } from "@/lib/food-translation";

export async function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const source = request.nextUrl.searchParams.get("source") ?? "auto";
  if (raw.length < 2 || raw.length > 80 || !["auto", "catalog", "usda", "off"].includes(source)) return NextResponse.json({ error: "En az iki karakterlik geçerli bir arama gir." }, { status: 400 });
  const normalized = normalizeFoodName(raw);
  if (normalized.length < 2) return NextResponse.json({ error: "En az iki harflik bir besin adı gir." }, { status: 400 });
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Oturumun sona erdi. Yeniden giriş yap." }, { status: 401 });
  try {
    if (source === "catalog") return NextResponse.json({ foods: await catalogFoods(normalized) }, { headers: { "Cache-Control": "private, no-store" } });
    if (source === "usda") return NextResponse.json({ foods: await usdaSearch(raw) }, { headers: { "Cache-Control": "private, no-store" } });
    if (source === "off") return NextResponse.json({ foods: await offSearch(raw) }, { headers: { "Cache-Control": "private, no-store" } });
    const warnings: string[] = [];
    let local = [] as Awaited<ReturnType<typeof catalogFoods>>;
    try {
      local = await catalogFoods(normalized);
      const localAlias = turkishFoodTerm(raw);
      if (localAlias && localAlias !== normalized) {
        const aliases = await catalogFoods(localAlias);
        const seen = new Set(local.map((food) => food.id));
        local.push(...aliases.filter((food) => !seen.has(food.id)));
      }
    } catch {
      warnings.push("Yerel besin kataloğuna ulaşılamadı; USDA sonuçları gösteriliyor.");
    }
    const keyMissing = !process.env.USDA_API_KEY;
    if (keyMissing) warnings.push("USDA_API_KEY tanımlı değil; sınırlı DEMO_KEY kullanılıyor.");
    const english = await englishFoodTerm(raw);
    try {
      const external = await usdaSearch(english ?? raw);
      const seen = new Set(local.map((food) => `${food.source}:${food.source_food_id}`));
      const foods = [...local, ...external.filter((food) => !seen.has(`${food.source}:${food.source_food_id}`))];
      return NextResponse.json({ foods, warnings, translatedQuery: english }, { headers: { "Cache-Control": "private, no-store" } });
    } catch (cause) {
      warnings.push(cause instanceof Error ? cause.message : "USDA şu anda kullanılamıyor.");
      return NextResponse.json({ foods: local, warnings, translatedQuery: english }, { headers: { "Cache-Control": "private, no-store" } });
    }
  } catch (cause) {
    console.error("Food search failed", cause);
    return NextResponse.json({ error: cause instanceof Error && /sınırına|iletişim e-postası|Open Food Facts/.test(cause.message) ? cause.message : "Besin araması şu anda kullanılamıyor. Manuel giriş yapabilirsin." }, { status: 503 });
  }
}
