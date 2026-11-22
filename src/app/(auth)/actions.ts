"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateLogin, validateRegistration } from "@/lib/auth/validation";

export type AuthFormState = { error: string | null; status: "idle" | "email-confirmation" };

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function registerAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = validateRegistration({
    username: textValue(formData, "username"),
    email: textValue(formData, "email"),
    password: textValue(formData, "password"),
    confirmPassword: textValue(formData, "confirmPassword"),
  });
  if (validated.error) return { error: validated.error, status: "idle" };

  let hasSession = false;
  try {
    const supabase = await createClient();
    const { data: available, error: availabilityError } = await supabase.rpc("username_available", { candidate: validated.username });
    if (availabilityError) {
      console.error("Username availability lookup failed", availabilityError);
      return { error: "Kayıt şu anda tamamlanamıyor. Lütfen daha sonra tekrar dene.", status: "idle" };
    }
    if (!available) return { error: "Bu kullanıcı adı alınmış. Başka bir ad seç.", status: "idle" };

    const requestOrigin = (await headers()).get("origin") ?? "http://localhost:3000";
    const { data, error } = await supabase.auth.signUp({
      email: validated.email!,
      password: validated.password!,
      options: {
        data: { username: validated.username },
        emailRedirectTo: new URL("/auth/callback", requestOrigin).toString(),
      },
    });
    if (error) {
      console.error("Sign up failed", error);
      const { data: stillAvailable } = await supabase.rpc("username_available", { candidate: validated.username });
      if (stillAvailable === false) return { error: "Bu kullanıcı adı alınmış. Başka bir ad seç.", status: "idle" };
      if (error.code === "email_exists" || error.code === "user_already_exists" || error.message.toLowerCase().includes("already registered")) return { error: "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı dene.", status: "idle" };
      return { error: "Hesap oluşturulamadı. Bilgilerini kontrol edip tekrar dene.", status: "idle" };
    }
    hasSession = Boolean(data.session);
  } catch (error) {
    console.error("Sign up request failed", error);
    return { error: "Bağlantı kurulamadı. İnternet bağlantını ve uygulama ayarlarını kontrol et.", status: "idle" };
  }

  if (hasSession) {
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }
  return { error: null, status: "email-confirmation" };
}

export async function loginAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = validateLogin({ email: textValue(formData, "email"), password: textValue(formData, "password") });
  if (validated.error) return { error: validated.error, status: "idle" };

  let destination = "/onboarding";
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: validated.email!, password: validated.password! });
    if (error) {
      console.error("Sign in failed", error);
      if (error.code === "invalid_credentials") return { error: "E-posta veya şifre hatalı.", status: "idle" };
      if (error.code === "email_not_confirmed") return { error: "Devam etmek için e-posta adresini doğrula.", status: "idle" };
      return { error: "Giriş yapılamadı. Biraz sonra tekrar dene.", status: "idle" };
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError ?? new Error("User missing after sign in");
    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("onboarding_completed").eq("id", user.id).single();
    if (profileError || !profile) {
      console.error("Profile missing after sign in", profileError);
      await supabase.auth.signOut();
      return { error: "Profilin yüklenemedi. Veritabanı kurulumunu kontrol edip tekrar dene.", status: "idle" };
    }
    destination = profile.onboarding_completed ? "/home" : "/onboarding";
  } catch (error) {
    console.error("Sign in request failed", error);
    return { error: "Bağlantı kurulamadı. Biraz sonra tekrar dene.", status: "idle" };
  }
  revalidatePath("/", "layout");
  redirect(destination);
}

export async function logoutAction(_previous: { error: string | null }): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Sign out failed", error);
    return { ..._previous, error: "Çıkış yapılamadı. Tekrar dene." };
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
