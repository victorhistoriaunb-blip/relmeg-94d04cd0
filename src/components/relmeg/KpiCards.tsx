import { Users, ThumbsUp, MapPin, Flag } from "lucide-react";
import type { Parlamentar } from "@/lib/relmeg/types";
import { isFavoravel } from "@/lib/relmeg/types";

function topOf(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0];
}

export function KpiCards({ data }: { data: Parlamentar[] }) {
  const favoraveis = data.filter((p) => isFavoravel(p.termometro)).length;
  const uf = topOf(data.map((p) => p.uf));
  const partido = topOf(data.map((p) => p.partido));

  const cards = [
    { label: "Total de Parlamentares", value: String(data.length), hint: "na seleção atual", icon: Users },
    {
      label: "Total Favoráveis",
      value: String(favoraveis),
      hint: data.length ? `${Math.round((favoraveis / data.length) * 100)}% da base` : "—",
      icon: ThumbsUp,
    },
    { label: "UF com maior presença", value: uf?.[0] ?? "—", hint: uf ? `${uf[1]} parlamentares` : "—", icon: MapPin },
    {
      label: "Partido principal",
      value: partido?.[0] ?? "—",
      hint: partido ? `${partido[1]} parlamentares` : "—",
      icon: Flag,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="panel rise-in rounded-lg p-4 transition-transform duration-300 hover:-translate-y-0.5"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{card.label}</p>
            <card.icon className="h-4 w-4 shrink-0 text-primary" />
          </div>
          <p className="mt-3 truncate font-display text-3xl font-semibold">{card.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}