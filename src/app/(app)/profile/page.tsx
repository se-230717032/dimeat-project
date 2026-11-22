import { UserRound } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { LogoutButton } from "@/components/auth/logout-button";
import { getAuthState } from "@/lib/auth/session";
import { Avatar } from "@/components/ui/avatar";

export default async function Page() {
  const state = await getAuthState();
  if (state.kind !== "authenticated") return null;
  return <>
    <div className="profile-summary"><Avatar name={state.profile.username} /><div><strong>{state.profile.username}</strong><span>{state.user.email}</span></div></div>
    <PlaceholderPage eyebrow="SENİN ALANIN" title="Profil" description="Yolculuğuna ve ilerlemene tek bir yerden bak." icon={UserRound} emptyTitle="İlerleme bilgilerin burada olacak" emptyDescription="Profil ve ilerleme özetlerin sonraki adımlarda burada görünecek." backHref="/settings" backLabel="Ayarlara git" />
    <div className="mobile-logout"><LogoutButton /></div>
  </>;
}
