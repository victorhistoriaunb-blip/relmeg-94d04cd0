import { Users, ThumbsUp, ThumbsDown, MapPin } from "lucide-react";
import type { Parlamentar } from "@/lib/relmeg/types";
import { temasContrariosDe, temasInteresseDe } from "@/lib/relmeg/types";

function topOf(values: string[]) {
  const counts = new Map<string, number>();
  values.map((v) => v.trim()).filter(Boolean).forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
}

export function KpiCards({ data }: { data: Parlamentar[] }) {
  const apoio = topOf(data.flatMap(temasInteresseDe));
  const resistencia = topOf(data.flatMap(temasContrariosDe));
  const uf = topOf(data.map((p) => p.uf));

  const cards = [
    { label: "Total de Parlamentares", value: String(data.length), hint: "na seleção atual", icon: Users },
    {
      label: "Tema com Maior Apoio",
      value: apoio?.[0] ?? "—",
      hint: apoio ? `${apoio[1]} parlamentares favoráveis` : "—",
      icon: ThumbsUp,
    },
    {
      label: "Tema com Maior Resistência",
      value: resistencia?.[0] ?? "—",
      hint: resistencia ? `${resistencia[1]} parlamentares contrários` : "—",
      icon: ThumbsDown,
    },
    {
      label: "UF com Maior Representação",
      value: uf?.[0] ?? "—",
      hint: uf ? `${uf[1]} parlamentares` : "—",
      icon: MapPin,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="panel panel-hover rise-in rounded-xl p-4 transition-transform duration-300 hover:-translate-y-0.5"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{card.label}</p>
            <card.icon className="h-4 w-4 shrink-0 text-primary" />
          </div>
          <p className="mt-3 truncate font-display text-2xl font-semibold" title={card.value}>
            {card.value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}
