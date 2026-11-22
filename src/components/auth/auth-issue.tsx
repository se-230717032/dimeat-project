import Link from "next/link";
import { LogoutButton } from "./logout-button";

export function AuthIssue({ kind }: { kind: "profile-missing" | "unavailable" }) {
  return <main className="status-page"><h1>{kind === "profile-missing" ? "Profilin yüklenemedi" : "Bağlantı kurulamıyor"}</h1><p>{kind === "profile-missing" ? "Veritabanı kurulumunu kontrol edip yeniden deneyebilirsin." : "Bağlantını kontrol edip sayfayı yenileyebilirsin."}</p><div className="issue-actions"><Link href="/" className="button button-secondary">Yeniden dene</Link><LogoutButton /></div></main>;
}
