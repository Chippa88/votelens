import { clsx } from "clsx";

interface Props {
  party?: string;
  size?: "sm" | "md";
}

export function PartyBadge({ party, size = "md" }: Props) {
  const p = party?.toLowerCase() || "";
  const isDem = p.includes("democrat") || p.includes("dem");
  const isRep = p.includes("republican") || p.includes("rep");
  const label = isDem ? "D" : isRep ? "R" : "I";
  const colors = isDem ? "bg-democrat/20 text-democrat border-democrat/30"
    : isRep ? "bg-republican/20 text-republican border-republican/30"
    : "bg-independent/20 text-independent border-independent/30";

  return (
    <span className={clsx("font-bold border rounded-md", colors,
      size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1"
    )}>
      {label}
    </span>
  );
}