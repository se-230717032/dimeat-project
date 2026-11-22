"use client";
import { Button } from "@/components/ui/button";
export default function Error({ reset }: { error: Error; reset: () => void }) { return <main className="status-page"><h1>Bir şeyler ters gitti</h1><p>Sayfayı yeniden deneyebilirsin.</p><Button onClick={reset}>Tekrar dene</Button></main>; }
