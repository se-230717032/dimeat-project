"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

function Submit({ compact }: { compact?: boolean }) {
  const { pending } = useFormStatus();
  return <button className={`logout-button ${compact ? "compact" : ""}`} type="submit" disabled={pending} aria-label="Çıkış yap"><LogOut size={17} aria-hidden="true" />{!compact && <span>{pending ? "Çıkış yapılıyor..." : "Çıkış yap"}</span>}</button>;
}

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [state, formAction] = useActionState(logoutAction, { error: null });
  return <form action={formAction} className="logout-form"><Submit compact={compact} />{state.error && <p role="alert" className="form-error">{state.error}</p>}</form>;
}
