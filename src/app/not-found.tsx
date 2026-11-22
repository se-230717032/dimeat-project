import Link from "next/link";
export default function NotFound() { return <main className="status-page"><span className="eyebrow">404</span><h1>Bu sayfayı bulamadık</h1><p>Aradığın sayfa taşınmış olabilir.</p><Link className="button button-primary" href="/home">Ana sayfaya dön</Link></main>; }
