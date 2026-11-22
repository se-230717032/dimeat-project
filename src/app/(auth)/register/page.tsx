import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getAuthState, homeForAuth } from "@/lib/auth/session";
import { AuthIssue } from "@/components/auth/auth-issue";

export default async function Page() {
  const state = await getAuthState();
  if (state.kind === "authenticated") redirect(homeForAuth(state));
  if (state.kind === "profile-missing") return <AuthIssue kind={state.kind} />;
  return <>{state.kind === "unconfigured" && <p className="setup-notice" role="status">Supabase bağlantısı eksik. Geliştirici olarak .env.local dosyasını yapılandır.</p>}{state.kind === "unavailable" && <p className="setup-notice" role="status">Bağlantı kurulamıyor. Biraz sonra tekrar dene.</p>}<AuthForm mode="register" /></>;
}
