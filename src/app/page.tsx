import { redirect } from "next/navigation";
import { getAuthState, homeForAuth } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ code?: string; error_code?: string }> }) {
  const { code, error_code: errorCode } = await searchParams;
  if (code || errorCode) {
    const params = new URLSearchParams();
    if (code) params.set("code", code);
    if (errorCode) params.set("error_code", errorCode);
    redirect(`/auth/callback?${params.toString()}`);
  }
  redirect(homeForAuth(await getAuthState()));
}
