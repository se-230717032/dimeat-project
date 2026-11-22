import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/", "/login", "/register", "/onboarding", "/home/:path*", "/diary/:path*", "/habits/:path*", "/community/:path*", "/messages/:path*", "/profile/:path*", "/settings/:path*", "/auth/confirm"],
};
