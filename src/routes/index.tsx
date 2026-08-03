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
import { useRelmeg } from "@/lib/relmeg/store";
import { setoresDe, temasContrariosDe, temasInteresseDe, type Parlamentar } from "@/lib/relmeg/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Perfis de Parlamentares — RelMeg" },
      {
        name: "description",
        content:
          "Perfis parlamentares com filtros por partido, UF, cargo, setor, temas de interesse e temas contrários.",
      },
      { property: "og:title", content: "Perfis de Parlamentares — RelMeg" },
      {
        property: "og:description",
        content: "Organize e consulte sua base parlamentar com filtros inteligentes e briefings prontos.",
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

  const Cabecalho = () => (
    <div>
      <h1 className="font-display text-2xl font-semibold">{textos.perfisTitulo}</h1>
      <p className="text-sm text-muted-foreground">{textos.perfisSubtitulo}</p>
    </div>
  );

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <Cabecalho />
        <EmptyState
          titulo="Nenhuma base carregada"
          descricao="Importe uma planilha Excel (.xlsx) ou CSV no painel Admin para gerar os perfis, os indicadores e os dashboards."
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
                    <Badge
                      key={t}
                      variant="outline"
                      className="border-success/40 bg-success/15 font-normal text-success"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
              {temasContrariosDe(p).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {temasContrariosDe(p).map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="border-destructive/40 bg-destructive/15 font-normal text-destructive"
                    >
                      {t}
                    </Badge>
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
        <div className="panel overflow-x-auto rounded-xl">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-foreground">Nome</TableHead>
                <TableHead className="text-foreground">Partido</TableHead>
                <TableHead className="text-foreground">UF</TableHead>
                <TableHead className="text-foreground">Cargo</TableHead>
                <TableHead className="text-foreground">Temas de Interesse</TableHead>
                <TableHead className="text-foreground">Temas Contrários</TableHead>
                <TableHead className="text-foreground">Setores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelecionado(p)}>
                  <TableCell className="font-medium text-foreground">{p.nome}</TableCell>
                  <TableCell className="text-foreground/90">{p.partido}</TableCell>
                  <TableCell className="text-foreground/90">{p.uf}</TableCell>
                  <TableCell className="text-foreground/90">{p.cargo}</TableCell>
                  <TableCell className="text-success">{temasInteresseDe(p).join(", ") || "—"}</TableCell>
                  <TableCell className="text-destructive">{temasContrariosDe(p).join(", ") || "—"}</TableCell>
                  <TableCell className="text-foreground/80">{setoresDe(p).join(", ") || "—"}</TableCell>
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
