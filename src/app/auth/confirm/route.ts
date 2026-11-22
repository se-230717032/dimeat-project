import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const destination = new URL("/login?confirmation=invalid", request.url);
  if (!tokenHash || request.nextUrl.searchParams.get("type") !== "email") return NextResponse.redirect(destination);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (error) {
      console.error("Email verification failed", error);
      return NextResponse.redirect(destination);
    }
    return NextResponse.redirect(new URL("/onboarding", request.url));
  } catch (error) {
    console.error("Email verification request failed", error);
    return NextResponse.redirect(destination);
  }
}
