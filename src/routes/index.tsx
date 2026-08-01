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
import { TermometroBadge } from "@/components/relmeg/TermometroBadge";
import { useRelmeg } from "@/lib/relmeg/store";
import { setoresDe, type Parlamentar } from "@/lib/relmeg/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Catálogo de Parlamentares — RelMeg" },
      {
        name: "description",
        content: "Catálogo analítico de parlamentares com filtros por partido, UF, cargo, setor e termômetro.",
      },
      { property: "og:title", content: "Catálogo de Parlamentares — RelMeg" },
      {
        property: "og:description",
        content: "Organize e consulte sua base parlamentar com filtros inteligentes e briefings prontos.",
      },
    ],
  }),
  component: Catalogo,
});

function Catalogo() {
  const { data, filters } = useRelmeg();
  const [view, setView] = useState<"cards" | "tabela">("cards");
  const [selecionado, setSelecionado] = useState<Parlamentar | null>(null);
  const filtrados = aplicarFiltros(data, filters);

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <Cabecalho />
        <EmptyState
          titulo="Nenhuma base carregada"
          descricao="Importe uma planilha Excel (.xlsx) ou CSV no painel Admin para gerar o catálogo, os indicadores e os dashboards."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Cabecalho />
      <KpiCards data={filtrados} />
      <FilterBar data={data} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filtrados.length} de {data.length} parlamentares
        </p>
        <div className="flex gap-1 rounded-md border border-border p-1">
          <Button
            size="sm"
            variant={view === "cards" ? "secondary" : "ghost"}
            onClick={() => setView("cards")}
          >
            <LayoutGrid className="h-4 w-4" /> Cards
          </Button>
          <Button
            size="sm"
            variant={view === "tabela" ? "secondary" : "ghost"}
            onClick={() => setView("tabela")}
          >
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
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base font-semibold leading-tight">{p.nome}</h3>
                <TermometroBadge value={p.termometro} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {[p.cargo, [p.partido, p.uf].filter(Boolean).join("/")].filter(Boolean).join(" • ")}
              </p>
              {setoresDe(p).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {setoresDe(p).map((s) => (
                    <Badge key={s} variant="secondary" className="font-normal">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
              {p.descricao && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.descricao}</p>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="panel overflow-hidden rounded-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Partido</TableHead>
                <TableHead>UF</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Termômetro</TableHead>
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
                  <TableCell>
                    <TermometroBadge value={p.termometro} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{setoresDe(p).join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DetailPanel parlamentar={selecionado} onClose={() => setSelecionado(null)} />
    </div>
  );
}

function Cabecalho() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Catálogo</h1>
      <p className="text-sm text-muted-foreground">
        Base parlamentar organizada para inteligência de Relações Governamentais.
      </p>
    </div>
  );
}
