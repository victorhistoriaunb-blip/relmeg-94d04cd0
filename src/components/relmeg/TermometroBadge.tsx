import { Badge } from "@/components/ui/badge";
import { normalizeKey } from "@/lib/relmeg/types";

export function TermometroBadge({ value }: { value: string }) {
  if (!value) return null;
  const n = normalizeKey(value);
  const tone = n.includes("contra") || n.includes("desfavoravel")
    ? "border-destructive/40 bg-destructive/15 text-destructive"
    : n.includes("favoravel")
      ? "border-success/40 bg-success/15 text-success"
      : "border-warning/40 bg-warning/15 text-warning";
  return (
    <Badge variant="outline" className={tone}>
      {value}
    </Badge>
  );
}