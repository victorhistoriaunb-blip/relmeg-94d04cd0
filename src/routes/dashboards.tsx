import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Plus, Star, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KpiCards } from "@/components/relmeg/KpiCards";
import { FichaDialog } from "@/components/relmeg/FichaDialog";
import { EmptyState } from "@/components/relmeg/EmptyState";
import { FilterBar, aplicarFiltros } from "@/components/relmeg/FilterBar";
import { adicionarWidget, editarWidget, excluirWidget, useRelmeg } from "@/lib/relmeg/store";
import { agregar } from "@/lib/relmeg/report";
import type { DashboardWidget, DataColumn, DataRecord } from "@/lib/relmeg/types";

export const Route = createFileRoute("/dashboards")({
  head: () => ({
    meta: [
      { title: "Dashboards Universais — RelMeg" },
      { name: "description", content: "Monte gráficos a partir de qualquer coluna da sua base e escolha quais ficam em destaque." },
      { property: "og:title", content: "Dashboards Universais — RelMeg" },
      { property: "og:description", content: "Construtor de dashboards para qualquer planilha CSV ou Excel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboards,
});

const CORES = ["oklch(0.72 0.17 255)", "oklch(0.79 0.13 215)", "oklch(0.76 0.14 195)", "oklch(0.68 0.18 285)", "oklch(0.84 0.1 235)"];
const EIXO = "oklch(0.86 0.02 258)";
const GRADE = "oklch(0.32 0.035 260)";
const tip = {
  contentStyle: { backgroundColor: "oklch(0.21 0.038 264)", border: "1px solid oklch(0.42 0.05 262)", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "oklch(0.98 0.008 250)", fontWeight: 600 },
  itemStyle: { color: "oklch(0.93 0.012 250)" },
  cursor: { fill: "oklch(0.42 0.055 258)", opacity: 0.3 },
};
const tick = { fill: EIXO, fontSize: 12 };
const AGG: Record<DashboardWidget["aggregation"], string> = { count: "Contagem", sum: "Soma", average: "Média", min: "Mínimo", max: "Máximo" };

function Grafico({ w, data }: { w: DashboardWidget; data: DataRecord[] }): ReactElement {
  const d = agregar(data, w);
  if (w.chartType === "pie")
    return (
      <PieChart>
        <Pie data={d} dataKey="total" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {d.map((e, i) => <Cell key={e.name} fill={CORES[i % CORES.length]} />)}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 12, color: EIXO }} />
        <Tooltip {...tip} />
      </PieChart>
    );
  if (w.chartType === "line")
    return (
      <LineChart data={d}>
        <CartesianGrid vertical={false} stroke={GRADE} />
        <XAxis dataKey="name" stroke={EIXO} tick={tick} />
        <YAxis stroke={EIXO} tick={tick} />
        <Tooltip {...tip} />
        <Line dataKey="total" stroke={CORES[0]} strokeWidth={2} />
      </LineChart>
    );
  return (
    <BarChart data={d} layout="vertical" margin={{ left: 8, right: 16 }}>
      <CartesianGrid horizontal={false} stroke={GRADE} />
      <XAxis type="number" stroke={EIXO} tick={tick} />
      <YAxis type="category" dataKey="name" width={120} stroke={EIXO} tick={tick} />
      <Tooltip {...tip} />
      <Bar dataKey="total" fill={CORES[0]} radius={[0, 4, 4, 0]} />
    </BarChart>
  );
}

function Editor({ w, columns }: { w: DashboardWidget; columns: DataColumn[] }) {
  const nums = columns.filter((c) => c.type === "number");
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Input aria-label="Título" value={w.title} onChange={(e) => editarWidget(w.id, { title: e.target.value })} className="sm:col-span-2" />
      <Select value={w.categoryColumn} onValueChange={(v) => editarWidget(w.id, { categoryColumn: v })}>
        <SelectTrigger aria-label="Agrupar por"><SelectValue /></SelectTrigger>
        <SelectContent>{columns.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={w.chartType} onValueChange={(v) => editarWidget(w.id, { chartType: v as DashboardWidget["chartType"] })}>
        <SelectTrigger aria-label="Tipo"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="bar">Barras</SelectItem><SelectItem value="pie">Pizza</SelectItem><SelectItem value="line">Linha</SelectItem></SelectContent>
      </Select>
      <Select value={w.aggregation} onValueChange={(v) => editarWidget(w.id, v === "count" ? { aggregation: "count", valueColumn: null } : { aggregation: v as DashboardWidget["aggregation"], valueColumn: w.valueColumn ?? nums[0]?.key ?? null })}>
        <SelectTrigger aria-label="Cálculo"><SelectValue /></SelectTrigger>
        <SelectContent>{(Object.keys(AGG) as DashboardWidget["aggregation"][]).filter((a) => a === "count" || nums.length).map((a) => <SelectItem key={a} value={a}>{AGG[a]}</SelectItem>)}</SelectContent>
      </Select>
      {w.aggregation !== "count" && (
        <Select value={w.valueColumn ?? ""} onValueChange={(v) => editarWidget(w.id, { valueColumn: v })}>
          <SelectTrigger aria-label="Coluna numérica"><SelectValue placeholder="Coluna numérica" /></SelectTrigger>
          <SelectContent>{nums.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
      )}
    </div>
  );
}

function Painel({ w, data, columns }: { w: DashboardWidget; data: DataRecord[]; columns: DataColumn[] }) {
  return (
    <div className="panel panel-hover rounded-xl p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="font-display min-w-0 truncate text-base font-semibold">{w.title}</h2>
        <div className="flex shrink-0 gap-1">
          <Button size="icon" variant={w.isFeatured ? "default" : "ghost"} aria-label="Destacar" aria-pressed={w.isFeatured} onClick={() => editarWidget(w.id, { isFeatured: !w.isFeatured })}><Star /></Button>
          <Button size="icon" variant="ghost" aria-label={w.isVisible ? "Ocultar" : "Exibir"} onClick={() => editarWidget(w.id, { isVisible: !w.isVisible })}>{w.isVisible ? <Eye /> : <EyeOff />}</Button>
          <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => excluirWidget(w.id)}><Trash2 /></Button>
        </div>
      </div>
      <Editor w={w} columns={columns} />
      {w.isVisible && <div className="mt-4"><ResponsiveContainer width="100%" height={300}><Grafico w={w} data={data} /></ResponsiveContainer></div>}
    </div>
  );
}

function Dashboards() {
  const { data, dataset, widgets, filters, textos } = useRelmeg();
  const columns = dataset?.columns ?? [];
  const filtrados = aplicarFiltros(data, filters);
  const destaques = widgets.filter((w) => w.isFeatured && w.isVisible);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{textos.dashboardsTitulo}</h1>
          <p className="text-sm text-muted-foreground">{textos.dashboardsSubtitulo}</p>
        </div>
        {dataset && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => adicionarWidget()}><Plus />Novo dashboard</Button>
            <FichaDialog data={filtrados} columns={columns} widgets={widgets} filters={filters} />
          </div>
        )}
      </div>
      {!dataset || !data.length ? (
        <EmptyState titulo="Sem dados para analisar" descricao="Importe qualquer planilha CSV ou Excel no painel Admin para montar seus dashboards." />
      ) : (
        <>
          <KpiCards data={filtrados} columns={columns} />
          <FilterBar data={data} columns={columns} />
          {destaques.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display flex items-center gap-2 text-lg font-semibold"><Star className="h-4 w-4 text-primary" />Destaques</h2>
              <div className="grid gap-4 xl:grid-cols-2">
                {destaques.map((w) => (
                  <div key={w.id} className="panel glow-ring rounded-xl p-4 sm:p-5">
                    <h3 className="font-display mb-3 font-semibold">{w.title}</h3>
                    <ResponsiveContainer width="100%" height={300}><Grafico w={w} data={filtrados} /></ResponsiveContainer>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Todos os dashboards</h2>
            {widgets.length === 0 ? (
              <div className="panel rounded-xl p-10 text-center text-sm text-muted-foreground">Nenhum dashboard ainda. Clique em "Novo dashboard" para começar.</div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">{widgets.map((w) => <Painel key={w.id} w={w} data={filtrados} columns={columns} />)}</div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
