import Link from "next/link";
export const dynamic = "force-dynamic";
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <main className="auth-shell"><div className="auth-inner"><Link href="/home" className="brand">Dimeat<span className="brand-dot">.</span></Link>{children}</div></main>; }
