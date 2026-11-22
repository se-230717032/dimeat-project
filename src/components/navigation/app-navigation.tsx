"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings2 } from "lucide-react";
import { navigation } from "./items";
import { Avatar } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="sidebar" aria-label="Ana gezinme">
        <Link href="/home" className="brand">Dimeat<span className="brand-dot">.</span></Link>
        <div className="sidebar-caption">MENÜ</div>
        <nav className="sidebar-links" aria-label="Ana menü">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`sidebar-link ${isCurrent(pathname, href) ? "active" : ""}`} aria-current={isCurrent(pathname, href) ? "page" : undefined}>
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Link href="/settings" className={`sidebar-link ${isCurrent(pathname, "/settings") ? "active" : ""}`} aria-current={isCurrent(pathname, "/settings") ? "page" : undefined}>
            <Settings2 size={19} strokeWidth={1.9} aria-hidden="true" /><span>Ayarlar</span>
          </Link>
          <div className="account-slot"><Avatar name={username} size="sm" /><span><strong>{username}</strong><small>Hesabım</small></span></div>
          <LogoutButton />
        </div>
      </aside>
      <nav className="bottom-nav" aria-label="Mobil menü">
        {navigation.filter((item) => item.href !== "/habits").map(({ href, mobileLabel, icon: Icon }) => (
          <Link key={href} href={href} className={`bottom-link ${isCurrent(pathname, href) ? "active" : ""}`} aria-current={isCurrent(pathname, href) ? "page" : undefined}>
            <Icon size={21} strokeWidth={1.9} aria-hidden="true" /><span>{mobileLabel}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
