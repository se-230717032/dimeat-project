import type { GoalType } from "@/types/profile";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration(input: { username: string; email: string; password: string; confirmPassword: string }) {
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  if (username.length < 3 || username.length > 30) return { error: "Kullanıcı adı 3–30 karakter olmalıdır." };
  if (!emailPattern.test(email)) return { error: "Geçerli bir e-posta adresi gir." };
  if (input.password.length < 8) return { error: "Şifre en az 8 karakter olmalıdır." };
  if (input.password !== input.confirmPassword) return { error: "Şifreler eşleşmiyor." };
  return { username, email, password: input.password };
}

export function validateLogin(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  if (!emailPattern.test(email)) return { error: "Geçerli bir e-posta adresi gir." };
  if (!input.password) return { error: "Şifreni gir." };
  return { email, password: input.password };
}

export function validateBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Geçerli bir doğum tarihi gir.";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || value > new Date().toISOString().slice(0, 10)) return "Doğum tarihi gelecekte olamaz; geçerli bir tarih gir.";
  return null;
}

export function parseDecimal(value: string, label: "boy" | "kilo") {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return { error: `Geçerli bir ${label} değeri gir.` };
  const number = Number(normalized);
  if (!Number.isFinite(number) || (label === "boy" ? number < 50 || number > 300 : number <= 0 || number > 700)) return { error: `Geçerli bir ${label} değeri gir.` };
  return { value: number };
}

export function parseGoalType(value: string): GoalType | null {
  return value === "lose" || value === "maintain" || value === "gain" ? value : null;
}
