import { Search, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clearFilters, setFilter, useRelmeg } from "@/lib/relmeg/store";
import {
  setoresDe,
  temasContrariosDe,
  temasInteresseDe,
  type Filters,
  type Parlamentar,
} from "@/lib/relmeg/types";

const ALL = "__all__";

export function opcoes(data: Parlamentar[]) {
  const uniq = (values: string[]) => [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort();
  return {
    partido: uniq(data.map((p) => p.partido)),
    uf: uniq(data.map((p) => p.uf)),
    cargo: uniq(data.map((p) => p.cargo)),
    setor: uniq(data.flatMap(setoresDe)),
    temaInteresse: uniq(data.flatMap(temasInteresseDe)),
    temaContrario: uniq(data.flatMap(temasContrariosDe)),
  };
}

export function aplicarFiltros(data: Parlamentar[], f: Filters) {
  const busca = f.busca.trim().toLowerCase();
  return data.filter((p) => {
    if (f.partido && p.partido !== f.partido) return false;
    if (f.uf && p.uf !== f.uf) return false;
    if (f.cargo && p.cargo !== f.cargo) return false;
    if (f.setor && !setoresDe(p).includes(f.setor)) return false;
    if (f.temaInteresse && !temasInteresseDe(p).includes(f.temaInteresse)) return false;
    if (f.temaContrario && !temasContrariosDe(p).includes(f.temaContrario)) return false;
    if (
      busca &&
      ![p.nome, p.partido, p.uf, p.cargo, ...temasInteresseDe(p), ...temasContrariosDe(p), ...setoresDe(p)]
        .join(" ")
        .toLowerCase()
        .includes(busca)
    )
      return false;
    return true;
  });
}

export function FilterBar({ data }: { data: Parlamentar[] }) {
  const { filters } = useRelmeg();
  const opts = opcoes(data);

  const campos: { key: keyof Filters; label: string; values: string[] }[] = [
    { key: "temaInteresse", label: "Tema de interesse", values: opts.temaInteresse },
    { key: "temaContrario", label: "Tema contrário", values: opts.temaContrario },
    { key: "setor", label: "Setor", values: opts.setor },
    { key: "partido", label: "Partido", values: opts.partido },
    { key: "uf", label: "UF", values: opts.uf },
    { key: "cargo", label: "Cargo", values: opts.cargo },
  ];

  const ativos = Object.values(filters).filter(Boolean).length;

  return (
    <div className="panel panel-hover rounded-xl p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.busca}
            onChange={(e) => setFilter("busca", e.target.value)}
            placeholder="Buscar por tema estratégico, parlamentar, partido ou setor…"
            className="pl-9"
          />
        </div>
        {campos.map((campo) => (
          <Select
            key={campo.key}
            value={filters[campo.key] || ALL}
            onValueChange={(v) => setFilter(campo.key, v === ALL ? "" : v)}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder={campo.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{campo.label}: todos</SelectItem>
              {campo.values.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <Button variant="outline" onClick={clearFilters} disabled={!ativos}>
          <FilterX className="h-4 w-4" />
          Limpar Filtros{ativos ? ` (${ativos})` : ""}
        </Button>
      </div>
    </div>
  );
}
