import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

type Props = { eyebrow: string; title: string; description: string; icon: LucideIcon; emptyTitle: string; emptyDescription: string; backHref?: string; backLabel?: string };

export function PlaceholderPage({ eyebrow, title, description, icon, emptyTitle, emptyDescription, backHref, backLabel }: Props) {
  return <div className="placeholder-page"><PageHeader eyebrow={eyebrow} title={title} description={description} /><EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />{backHref && <Link className="text-link below-state" href={backHref}>{backLabel ?? "Devam et"}<ArrowRight size={16} aria-hidden="true" /></Link>}</div>;
}
