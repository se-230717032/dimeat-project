import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const errorCode = request.nextUrl.searchParams.get("error_code");
  const loginUrl = new URL("/login", request.url);

  if (errorCode || !code) {
    loginUrl.searchParams.set("confirmation", errorCode === "otp_expired" ? "expired" : "invalid");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Email confirmation code exchange failed", error);
      loginUrl.searchParams.set("confirmation", "expired");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.redirect(new URL("/onboarding", request.url));
  } catch (error) {
    console.error("Email confirmation callback failed", error);
    loginUrl.searchParams.set("confirmation", "unavailable");
    return NextResponse.redirect(loginUrl);
  }
}
