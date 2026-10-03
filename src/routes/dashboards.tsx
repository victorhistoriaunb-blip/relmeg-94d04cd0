import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Funnel, FunnelChart, LabelList, Legend, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, RadialBar, RadialBarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, Treemap, XAxis, YAxis } from "recharts";
import { Plus, Star, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KpiCards } from "@/components/relmeg/KpiCards";
import { FichaDialog } from "@/components/relmeg/FichaDialog";
import { EmptyState } from "@/components/relmeg/EmptyState";
import { FilterBar, aplicarFiltros } from "@/components/relmeg/FilterBar";
import { adicionarWidget, editarWidget, excluirWidget, moverWidget, useRelmeg } from "@/lib/relmeg/store";
import { agregar, fmtNum, registrosDe, valorKpi, ufDe, UFS, perfilBase, sugestoes, MODELOS, montarModelo } from "@/lib/relmeg/engine";
import { aplicarSugestoes } from "@/lib/relmeg/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cellText } from "@/lib/relmeg/types";
import { Maximize2, Minimize2, LayoutTemplate, Sparkles, Download } from "lucide-react";
import { CHART_TYPES, type DashboardWidget, type DataColumn, type DataRecord } from "@/lib/relmeg/types";

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
const AGG: Record<DashboardWidget["aggregation"], string> = { count: "Contagem", unique: "Valores únicos", sum: "Soma", average: "Média", min: "Mínimo", max: "Máximo" };

function Grafico({ w, data, columns, onPick, width, height }: { w: DashboardWidget; data: DataRecord[]; columns: DataColumn[]; onPick: (n: string) => void; width?: number; height?: number }): ReactElement {
  const d = agregar(data, w, { columns });
  const pick = (e: unknown) => { const o = e as { name?: string; payload?: { name?: string } } | null; const n = o?.payload?.name ?? o?.name; if (n) onPick(String(n)); };
  const size = width !== undefined && height !== undefined ? { width, height } : {};
  const cores = d.map((e, i) => <Cell key={e.name} fill={CORES[i % CORES.length]} />);
  switch (w.chartType) {
    case "pie":
    case "donut":
      return (
        <PieChart {...size}>
          <Pie onClick={pick} data={d} dataKey="total" nameKey="name" innerRadius={w.chartType === "donut" ? 60 : 0} outerRadius={100} paddingAngle={w.chartType === "donut" ? 2 : 0}>{cores}</Pie>
          <Legend wrapperStyle={{ fontSize: 12, color: EIXO }} />
          <Tooltip {...tip} />
        </PieChart>
      );
    case "line":
    case "area":
      return w.chartType === "line" ? (
        <LineChart data={d} {...size}>
          <CartesianGrid vertical={false} stroke={GRADE} /><XAxis dataKey="name" stroke={EIXO} tick={tick} /><YAxis stroke={EIXO} tick={tick} /><Tooltip {...tip} />
          <Line onClick={pick} dataKey="total" stroke={CORES[0]} strokeWidth={2} activeDot={{ onClick: (_: unknown, e: unknown) => pick(e) }} />
        </LineChart>
      ) : (
        <AreaChart data={d} {...size}>
          <CartesianGrid vertical={false} stroke={GRADE} /><XAxis dataKey="name" stroke={EIXO} tick={tick} /><YAxis stroke={EIXO} tick={tick} /><Tooltip {...tip} />
          <Area onClick={pick} dataKey="total" stroke={CORES[0]} fill={CORES[0]} fillOpacity={0.3} strokeWidth={2} activeDot={{ onClick: (_: unknown, e: unknown) => pick(e) }} />
        </AreaChart>
      );
    case "column":
      return (
        <BarChart data={d} {...size}>
          <CartesianGrid vertical={false} stroke={GRADE} /><XAxis dataKey="name" stroke={EIXO} tick={tick} /><YAxis stroke={EIXO} tick={tick} /><Tooltip {...tip} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]} onClick={pick}>{cores}</Bar>
        </BarChart>
      );
    case "stacked":
      return (
        <ComposedChart data={d} {...size}>
          <CartesianGrid vertical={false} stroke={GRADE} /><XAxis dataKey="name" stroke={EIXO} tick={tick} /><YAxis stroke={EIXO} tick={tick} /><Tooltip {...tip} />
          <Bar onClick={pick} dataKey="total" fill={CORES[1]} radius={[4, 4, 0, 0]} />
          <Line dataKey="total" stroke={CORES[3]} strokeWidth={2} />
        </ComposedChart>
      );
    case "radar":
      return (
        <RadarChart data={d} outerRadius={100} {...size}>
          <PolarGrid stroke={GRADE} /><PolarAngleAxis dataKey="name" tick={tick} /><PolarRadiusAxis stroke={EIXO} tick={{ ...tick, fontSize: 10 }} /><Tooltip {...tip} />
          <Radar dataKey="total" stroke={CORES[0]} fill={CORES[0]} fillOpacity={0.35} />
        </RadarChart>
      );
    case "radial":
      return (
        <RadialBarChart data={d.map((x, i) => ({ ...x, fill: CORES[i % CORES.length] }))} innerRadius={30} outerRadius={120} {...size}>
          <RadialBar onClick={pick} dataKey="total" background={{ fill: GRADE }} />
          <Legend wrapperStyle={{ fontSize: 12, color: EIXO }} />
          <Tooltip {...tip} />
        </RadialBarChart>
      );
    case "treemap":
      return (
        <Treemap onClick={pick} data={d.map((x, i) => ({ ...x, fill: CORES[i % CORES.length] }))} dataKey="total" nameKey="name" stroke="oklch(0.18 0.03 264)" {...size}>
          <Tooltip {...tip} />
        </Treemap>
      );
    case "funnel":
      return (
        <FunnelChart {...size}>
          <Tooltip {...tip} />
          <Funnel onClick={pick} data={d} dataKey="total" nameKey="name" isAnimationActive>{cores}<LabelList position="right" dataKey="name" fill={EIXO} stroke="none" fontSize={12} /></Funnel>
        </FunnelChart>
      );
    case "scatter":
      return (
        <ScatterChart {...size}>
          <CartesianGrid stroke={GRADE} /><XAxis dataKey="name" type="category" allowDuplicatedCategory={false} stroke={EIXO} tick={tick} /><YAxis dataKey="total" stroke={EIXO} tick={tick} /><Tooltip {...tip} />
          <Scatter onClick={pick} data={d} fill={CORES[0]}>{cores}</Scatter>
        </ScatterChart>
      );
    default:
      return (
        <BarChart data={d} layout="vertical" margin={{ left: 8, right: 16 }} {...size}>
          <CartesianGrid horizontal={false} stroke={GRADE} /><XAxis type="number" stroke={EIXO} tick={tick} /><YAxis type="category" dataKey="name" width={120} stroke={EIXO} tick={tick} /><Tooltip {...tip} />
          <Bar onClick={pick} dataKey="total" fill={CORES[0]} radius={[0, 4, 4, 0]} />
        </BarChart>
      );
  }
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
        <SelectContent>{CHART_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
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

type Arraste = { index: number; total: number; arrastando: boolean; sobre: boolean; onDragStart: () => void; onDragEnter: () => void; onDrop: () => void; onDragEnd: () => void };
function Painel({ w, data, columns, dnd }: { w: DashboardWidget; data: DataRecord[]; columns: DataColumn[]; dnd: Arraste }) {
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; dnd.onDragStart(); }}
      onDragEnter={dnd.onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); dnd.onDrop(); }}
      onDragEnd={dnd.onDragEnd}
      className={`panel panel-hover min-w-0 rounded-xl p-4 transition sm:p-5 ${dnd.arrastando ? "opacity-50" : ""} ${dnd.sobre ? "ring-2 ring-primary" : ""}`}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
          <span className="shrink-0 rounded bg-secondary px-1.5 text-xs text-secondary-foreground">{dnd.index + 1}</span>
          <h2 className="font-display min-w-0 truncate text-base font-semibold">{w.title}</h2>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button size="icon" variant="ghost" aria-label="Mover para cima" disabled={dnd.index === 0} onClick={() => moverWidget(w.id, dnd.index - 1)}><ArrowUp /></Button>
          <Button size="icon" variant="ghost" aria-label="Mover para baixo" disabled={dnd.index === dnd.total - 1} onClick={() => moverWidget(w.id, dnd.index + 1)}><ArrowDown /></Button>
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
  const [arrastado, setArrastado] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
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
              <>
                <p className="text-xs text-muted-foreground">Arraste os cartões ou use as setas para mudar a prioridade. A ordem vale também para os destaques e para as fichas exportadas.</p>
                <div className="grid gap-4 xl:grid-cols-2">{widgets.map((w, i) => (
                  <Painel key={w.id} w={w} data={filtrados} columns={columns} dnd={{
                    index: i, total: widgets.length, arrastando: arrastado === w.id, sobre: sobre === w.id && arrastado !== w.id,
                    onDragStart: () => setArrastado(w.id), onDragEnter: () => setSobre(w.id),
                    onDrop: () => { if (arrastado) void moverWidget(arrastado, i); setArrastado(null); setSobre(null); },
                    onDragEnd: () => { setArrastado(null); setSobre(null); },
                  }} />
                ))}</div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
