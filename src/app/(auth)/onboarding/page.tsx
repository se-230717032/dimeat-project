import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth/session";
import { AuthIssue } from "@/components/auth/auth-issue";
import { OnboardingFlow } from "@/components/auth/onboarding-flow";

export default async function Page() {
  const state = await getAuthState();
  if (state.kind === "anonymous" || state.kind === "unconfigured") redirect("/login");
  if (state.kind !== "authenticated") return <AuthIssue kind={state.kind} />;
  if (state.profile.onboarding_completed) redirect("/home");
  return <OnboardingFlow username={state.profile.username} profile={state.profile} />;
}
