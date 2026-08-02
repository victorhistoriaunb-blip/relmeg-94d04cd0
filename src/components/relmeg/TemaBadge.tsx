import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function TemaBadge({
  children,
  tipo = "interesse",
  className,
}: {
  children: React.ReactNode;
  tipo?: "interesse" | "contrario";
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-normal",
        tipo === "interesse"
          ? "border-success/40 bg-success/15 text-success"
          : "border-destructive/40 bg-destructive/15 text-destructive",
        className,
      )}
    >
      {children}
    </Badge>
  );
}
