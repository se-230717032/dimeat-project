import { BookOpen, House, MessageCircle, Sparkles, UsersRound, UserRound } from "lucide-react";

export const navigation = [
  { href: "/home", label: "Ana Sayfa", mobileLabel: "Ana Sayfa", icon: House },
  { href: "/diary", label: "Günlüğüm", mobileLabel: "Günlük", icon: BookOpen },
  { href: "/habits", label: "Alışkanlıklar", mobileLabel: "Alışkanlıklar", icon: Sparkles },
  { href: "/community", label: "Topluluk", mobileLabel: "Topluluk", icon: UsersRound },
  { href: "/messages", label: "Mesajlar", mobileLabel: "Mesajlar", icon: MessageCircle },
  { href: "/profile", label: "Profil", mobileLabel: "Profil", icon: UserRound },
] as const;
