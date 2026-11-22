type Props = { name: string; size?: "sm" | "md" };

export function Avatar({ name, size = "md" }: Props) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("tr-TR");
  return <span className={`avatar avatar-${size}`} aria-label={name} role="img">{initials}</span>;
}
