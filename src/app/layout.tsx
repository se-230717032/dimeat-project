import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Dimeat", template: "%s | Dimeat" },
  description: "Beslenmeni ve alışkanlıklarını kendi ritminde takip et.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
