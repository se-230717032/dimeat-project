import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getAuthState, homeForAuth } from "@/lib/auth/session";
import { AuthIssue } from "@/components/auth/auth-issue";

export default async function Page({ searchParams }: { searchParams: Promise<{ confirmation?: string }> }) {
  const state = await getAuthState();
  if (state.kind === "authenticated") redirect(homeForAuth(state));
  if (state.kind === "profile-missing") return <AuthIssue kind={state.kind} />;
  const params = await searchParams;
  const confirmationMessage = params.confirmation === "expired"
    ? "Doğrulama bağlantısının süresi dolmuş veya bağlantı daha önce kullanılmış. Yeni bir bağlantı iste ya da hesabın doğrulandıysa giriş yap."
    : params.confirmation === "invalid"
      ? "Doğrulama bağlantısı geçersiz. E-postandaki bağlantıyı yeniden açmayı dene."
      : params.confirmation === "unavailable"
        ? "Doğrulama şu anda tamamlanamıyor. Biraz sonra tekrar dene."
        : null;
  return <>{state.kind === "unconfigured" && <p className="setup-notice" role="status">Supabase bağlantısı eksik. Geliştirici olarak .env.local dosyasını yapılandır.</p>}{state.kind === "unavailable" && <p className="setup-notice" role="status">Bağlantı kurulamıyor. Biraz sonra tekrar dene.</p>}{confirmationMessage && <p className="form-error" role="alert">{confirmationMessage}</p>}<AuthForm mode="login" /></>;
}
