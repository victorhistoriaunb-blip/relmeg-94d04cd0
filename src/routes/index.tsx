import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutGrid, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCards } from "@/components/relmeg/KpiCards";
import { EmptyState } from "@/components/relmeg/EmptyState";
import { FilterBar, aplicarFiltros } from "@/components/relmeg/FilterBar";
import { DetailPanel } from "@/components/relmeg/DetailPanel";
import { TemaBadge } from "@/components/relmeg/TemaBadge";
import { useRelmeg } from "@/lib/relmeg/store";
import {
  setoresDe,
  temasContrariosDe,
  temasInteresseDe,
  type Parlamentar,
} from "@/lib/relmeg/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Perfis Parlamentares — RelMeg" },
      {
        name: "description",
        content:
          "Encontre parlamentares por tema estratégico e identifique apoios e resistências às pautas do seu cliente.",
      },
      { property: "og:title", content: "Perfis Parlamentares — RelMeg" },
      {
        property: "og:description",
        content: "Inteligência legislativa: temas de interesse, temas contrários, setores e perfis analíticos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Perfis,
});

function Perfis() {
  const { data, filters, textos } = useRelmeg();
  const [view, setView] = useState<"cards" | "tabela">("cards");
  const [selecionado, setSelecionado] = useState<Parlamentar | null>(null);
  const filtrados = aplicarFiltros(data, filters);

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <Cabecalho titulo={textos.perfisTitulo} descricao={textos.perfisDescricao} />
        <EmptyState
          titulo="Nenhuma base carregada"
          descricao="Importe uma planilha Excel (.xlsx) ou CSV no painel Admin para gerar os perfis, os indicadores e os dashboards."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Cabecalho titulo={textos.perfisTitulo} descricao={textos.perfisDescricao} />
      <KpiCards data={filtrados} />
      <FilterBar data={data} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filtrados.length} de {data.length} parlamentares
        </p>
        <div className="flex gap-1 rounded-md border border-border p-1">
          <Button size="sm" variant={view === "cards" ? "secondary" : "ghost"} onClick={() => setView("cards")}>
            <LayoutGrid className="h-4 w-4" /> Cards
          </Button>
          <Button size="sm" variant={view === "tabela" ? "secondary" : "ghost"} onClick={() => setView("tabela")}>
            <Rows3 className="h-4 w-4" /> Tabela
          </Button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="panel panel-hover rounded-xl p-10 text-center text-sm text-muted-foreground">
          Nenhum parlamentar corresponde aos filtros selecionados.
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelecionado(p)}
              className="panel panel-hover rise-in rounded-xl p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50"
              style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
            >
              <h3 className="font-display text-base font-semibold leading-tight">{p.nome}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {[p.cargo, [p.partido, p.uf].filter(Boolean).join("/")].filter(Boolean).join(" • ")}
              </p>
              {temasInteresseDe(p).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {temasInteresseDe(p).map((t) => (
                    <TemaBadge key={t}>{t}</TemaBadge>
                  ))}
                </div>
              )}
              {temasContrariosDe(p).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {temasContrariosDe(p).map((t) => (
                    <TemaBadge key={t} tipo="contrario">
                      {t}
                    </TemaBadge>
                  ))}
                </div>
              )}
              {setoresDe(p).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {setoresDe(p).map((s) => (
                    <Badge key={s} variant="secondary" className="font-normal">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
              {p.descricao && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.descricao}</p>}
            </button>
          ))}
        </div>
      ) : (
        <div className="panel overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Partido</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Temas de interesse</TableHead>
                  <TableHead>Temas contrários</TableHead>
                  <TableHead>Setores</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelecionado(p)}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>{p.partido}</TableCell>
                    <TableCell>{p.uf}</TableCell>
                    <TableCell>{p.cargo}</TableCell>
                    <TableCell className="text-success">{temasInteresseDe(p).join(", ") || "—"}</TableCell>
                    <TableCell className="text-destructive">{temasContrariosDe(p).join(", ") || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{setoresDe(p).join(", ") || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <DetailPanel parlamentar={selecionado} onClose={() => setSelecionado(null)} />
    </div>
  );
}

function Cabecalho({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">{titulo}</h1>
      <p className="text-sm text-muted-foreground">{descricao}</p>
    </div>
  );
}
