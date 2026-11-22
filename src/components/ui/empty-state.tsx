import type { LucideIcon } from "lucide-react";
import { Card } from "./card";

type Props = { icon: LucideIcon; title: string; description: string };

export function EmptyState({ icon: Icon, title, description }: Props) {
  return (
    <Card className="empty-state">
      <span className="empty-icon"><Icon size={24} strokeWidth={1.8} aria-hidden="true" /></span>
      <h2>{title}</h2>
      <p>{description}</p>
    </Card>
  );
}
