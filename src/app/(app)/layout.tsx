import { AppNavigation } from "@/components/navigation/app-navigation";
import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth/session";
import { AuthIssue } from "@/components/auth/auth-issue";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const state = await getAuthState();
  if (state.kind === "anonymous" || state.kind === "unconfigured") redirect("/login");
  if (state.kind !== "authenticated") return <AuthIssue kind={state.kind} />;
  if (!state.profile.onboarding_completed) redirect("/onboarding");
  return <div className="app-shell"><AppNavigation username={state.profile.username} /><main id="main-content" className="main-area"><div className="main-inner">{children}</div></main></div>;
}
