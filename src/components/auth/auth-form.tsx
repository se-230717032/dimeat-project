"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, registerAction, type AuthFormState } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateLogin, validateRegistration } from "@/lib/auth/validation";

function SubmitButton({ mode }: { mode: "login" | "register" }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? mode === "login" ? "Giriş yapılıyor..." : "Hesap oluşturuluyor..." : mode === "login" ? "Giriş yap" : "Hesap oluştur"}</Button>;
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const initialState: AuthFormState = { error: null, status: "idle" };
  const [state, formAction] = useActionState(mode === "login" ? loginAction : registerAction, initialState);
  const [localError, setLocalError] = useState<string | null>(null);

  if (state.status === "email-confirmation") {
    return <div className="auth-card auth-confirmation" role="status"><span className="eyebrow">BİR ADIM KALDI</span><h1>E-posta adresini doğrula</h1><p>Doğrulama bağlantısını e-posta kutuna gönderdik. Bağlantıyı açtığında başlangıç adımlarına yönlendirileceksin.</p><Link href="/login" className="button button-primary">Giriş sayfasına git</Link></div>;
  }

  const login = mode === "login";
  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "");
    const result = login
      ? validateLogin({ email: value("email"), password: value("password") })
      : validateRegistration({ username: value("username"), email: value("email"), password: value("password"), confirmPassword: value("confirmPassword") });
    if (result.error) { event.preventDefault(); setLocalError(result.error); }
    else setLocalError(null);
  }
  return <div className="auth-card">
    <span className="eyebrow">{login ? "TEKRAR HOŞ GELDİN" : "YENİ BİR BAŞLANGIÇ"}</span>
    <h1>{login ? "Giriş yap" : "Hesap oluştur"}</h1>
    <p>{login ? "İyi hissetme yolculuğuna kaldığın yerden devam et." : "Dimeat ile küçük adımlarını görünür kıl."}</p>
    <form action={formAction} noValidate onSubmit={validateBeforeSubmit} onChange={() => setLocalError(null)}>
      {!login && <Input id="username" name="username" label="Kullanıcı adı" autoComplete="username" minLength={3} maxLength={30} required placeholder="Kullanıcı adın" />}
      <Input id="email" name="email" label="E-posta" type="email" autoComplete="email" required placeholder="ornek@eposta.com" />
      <Input id="password" name="password" label="Şifre" type="password" autoComplete={login ? "current-password" : "new-password"} minLength={login ? undefined : 8} required placeholder="••••••••" />
      {!login && <Input id="confirmPassword" name="confirmPassword" label="Şifre tekrar" type="password" autoComplete="new-password" minLength={8} required placeholder="••••••••" />}
      {(localError ?? state.error) && <p className="form-error" role="alert">{localError ?? state.error}</p>}
      <SubmitButton mode={mode} />
    </form>
    <p className="auth-switch">{login ? "Henüz hesabın yok mu? " : "Zaten hesabın var mı? "}<Link href={login ? "/register" : "/login"}>{login ? "Kayıt sayfasına git" : "Giriş sayfasına git"}</Link></p>
  </div>;
}
