import { getAuthState } from "@/lib/auth/session";
import { DashboardView } from "@/components/meals/dashboard-view";

export default async function HomePage() {
  const state = await getAuthState();
  return <DashboardView username={state.kind === "authenticated" ? state.profile.username : ""} />;
}
