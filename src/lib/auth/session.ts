import "server-only";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/profile";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type AuthState =
  | { kind: "unconfigured" }
  | { kind: "anonymous" }
  | { kind: "unavailable" }
  | { kind: "profile-missing"; user: User }
  | { kind: "authenticated"; user: User; profile: Profile };

export const getAuthState = cache(async (): Promise<AuthState> => {
  if (!hasSupabaseConfig()) return { kind: "unconfigured" };

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      if ((userError.status ?? 0) >= 500 || userError.message.toLowerCase().includes("fetch")) {
        console.error("Auth user lookup failed", userError);
        return { kind: "unavailable" };
      }
      return { kind: "anonymous" };
    }
    if (!user) return { kind: "anonymous" };

    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("id, username, avatar_url, birth_date, height_cm, current_weight_kg, target_weight_kg, goal_type, onboarding_completed, created_at, updated_at")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile lookup failed", profileError);
      return { kind: "profile-missing", user };
    }
    return { kind: "authenticated", user, profile: profile as Profile };
  } catch (error) {
    console.error("Auth state failed", error);
    return { kind: "unavailable" };
  }
});

export function homeForAuth(state: AuthState) {
  return state.kind === "authenticated"
    ? state.profile.onboarding_completed ? "/home" : "/onboarding"
    : "/login";
}
