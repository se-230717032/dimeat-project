import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { catalogFood, offDetail, usdaDetail } from "@/lib/food-sources";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const source = request.nextUrl.searchParams.get("source") ?? "";
  if (!id || !["catalog", "usda", "off"].includes(source)) return NextResponse.json({ error: "Geçersiz besin." }, { status: 400 });
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Oturumun sona erdi." }, { status: 401 });
  try {
    const food = source === "catalog" ? await catalogFood(id) : source === "usda" ? await usdaDetail(id) : await offDetail(id);
    if (!food) return NextResponse.json({ error: "Besin bulunamadı." }, { status: 404 });
    return NextResponse.json({ food }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (cause) {
    console.error("Food detail failed", cause);
    return NextResponse.json({ error: "Besin ayrıntısı yüklenemedi. Manuel giriş yapabilirsin." }, { status: 503 });
  }
}
