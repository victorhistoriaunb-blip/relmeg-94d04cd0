import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
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

const UF_GRID: [string, number, number][] = [["RR",2,0],["AP",4,0],["AM",1,1],["PA",3,1],["MA",4,1],["CE",5,1],["RN",6,1],["AC",0,2],["RO",1,2],["TO",3,2],["PI",4,2],["PB",6,2],["MT",2,3],["BA",4,3],["PE",5,3],["AL",6,3],["GO",3,4],["DF",4,4],["SE",5,4],["MS",2,5],["MG",3,5],["ES",4,5],["SP",2,6],["RJ",3,6],["PR",2,7],["SC",2,8],["RS",1,9]];

function MapaUF({ w, data, onPick }: { w: DashboardWidget; data: DataRecord[]; onPick: (n: string) => void }) {
  const tot = new Map<string, { total: number; nome: string }>();
  const pts = agregar(data, { ...w, chartType: "map_uf", itemLimit: 9999 });
  for (const p of pts) { const uf = ufDe(p.name); if (!uf) continue; const e = tot.get(uf) ?? { total: 0, nome: p.name }; e.total += p.total; tot.set(uf, e); }
  const max = Math.max(1, ...[...tot.values()].map((e) => e.total));
  const sem = pts.filter((p) => !ufDe(p.name)).reduce((a, p) => a + p.registros, 0);
  return (
    <div className="flex h-full flex-col">
      <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gridTemplateRows: "repeat(10, minmax(0, 1fr))" }}>
        {UF_GRID.map(([uf, x, y]) => { const e = tot.get(uf); const a = e ? 0.18 + 0.82 * (e.total / max) : 0; return (
          <button key={uf} type="button" disabled={!e} onClick={() => e && onPick(e.nome)} title={`${UFS[uf]}: ${e ? fmtNum(e.total) : 0}`} style={{ gridColumn: x + 1, gridRow: y + 1, backgroundColor: e ? `oklch(0.66 0.17 255 / ${a})` : undefined }} className="flex min-h-7 flex-col items-center justify-center rounded border border-border text-[10px] font-semibold leading-tight text-foreground transition hover:ring-2 hover:ring-primary disabled:opacity-40">
            {uf}<span className="font-normal">{e ? fmtNum(e.total) : ""}</span>
          </button>
        ); })}
      </div>
      {sem > 0 && <p className="mt-2 text-xs text-muted-foreground">{fmtNum(sem)} registros sem UF reconhecida.</p>}
    </div>
  );
}

function MapaPontos({ w, data }: { w: DashboardWidget; data: DataRecord[] }) {
  const pts = data.map((r) => ({ lat: Number(String(r.data[w.categoryColumn] ?? "").replace(",", ".")), lng: Number(String(r.data[w.valueColumn ?? ""] ?? "").replace(",", ".")) })).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180 && (p.lat !== 0 || p.lng !== 0));
  return (
    <div className="flex h-full flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid stroke={GRADE} /><XAxis type="number" dataKey="lng" name="Longitude" domain={["auto", "auto"]} stroke={EIXO} tick={tick} /><YAxis type="number" dataKey="lat" name="Latitude" domain={["auto", "auto"]} stroke={EIXO} tick={tick} /><Tooltip {...tip} />
          <Scatter data={pts} fill={CORES[0]} fillOpacity={0.55} />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="mt-1 text-xs text-muted-foreground">{fmtNum(pts.length)} de {fmtNum(data.length)} registros com coordenadas válidas.</p>
    </div>
  );
}

function Componente({ w, data, columns, onPick, onAll }: { w: DashboardWidget; data: DataRecord[]; columns: DataColumn[]; onPick: (n: string) => void; onAll: () => void }) {
  if (w.chartType === "kpi") {
    const v = valorKpi(data, w);
    return <button type="button" onClick={onAll} className="flex h-full w-full flex-col items-start justify-center rounded-lg text-left hover:bg-secondary/40"><span className="font-display text-4xl font-semibold">{fmtNum(v)}</span><span className="mt-1 text-sm text-muted-foreground">{AGG[w.aggregation]}{w.aggregation !== "count" && w.valueColumn ? ` de ${columns.find((c) => c.key === w.valueColumn)?.label ?? ""}` : ""} · clique para ver os registros</span></button>;
  }
  if (w.chartType === "table") {
    const d = agregar(data, w, { columns }); const total = d.reduce((a, b) => a + b.total, 0);
    return <div className="h-full overflow-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground"><tr><th className="py-1.5">{columns.find((c) => c.key === w.categoryColumn)?.label}</th><th className="text-right">{AGG[w.aggregation]}</th><th className="text-right">%</th></tr></thead><tbody>{d.map((p) => <tr key={p.name} onClick={() => onPick(p.name)} className="cursor-pointer border-t border-border hover:bg-secondary/40"><td className="py-1.5 pr-2">{p.name}</td><td className="text-right tabular-nums">{fmtNum(p.total)}</td><td className="text-right tabular-nums text-muted-foreground">{total ? fmtNum((p.total / total) * 100) : 0}%</td></tr>)}</tbody></table></div>;
  }
  if (w.chartType === "map_uf") return <MapaUF w={w} data={data} onPick={onPick} />;
  if (w.chartType === "map_points") return <MapaPontos w={w} data={data} />;
  return <ResponsiveContainer width="100%" height="100%"><Grafico w={w} data={data} columns={columns} onPick={onPick} /></ResponsiveContainer>;
}

function Editor({ w, columns }: { w: DashboardWidget; columns: DataColumn[] }) {
  const nums = columns.filter((c) => c.type === "number");
  const pontos = w.chartType === "map_points";
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Input aria-label="Título" value={w.title} onChange={(e) => editarWidget(w.id, { title: e.target.value })} className="sm:col-span-2" />
      <Select value={w.chartType} onValueChange={(v) => editarWidget(w.id, { chartType: v as DashboardWidget["chartType"] })}>
        <SelectTrigger aria-label="Tipo"><SelectValue /></SelectTrigger>
        <SelectContent>{CHART_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={w.categoryColumn} onValueChange={(v) => editarWidget(w.id, { categoryColumn: v })}>
        <SelectTrigger aria-label={pontos ? "Latitude" : "Agrupar por"}><SelectValue /></SelectTrigger>
        <SelectContent>{columns.map((c) => <SelectItem key={c.key} value={c.key}>{pontos ? "Latitude: " : ""}{c.label}</SelectItem>)}</SelectContent>
      </Select>
      {pontos ? (
        <Select value={w.valueColumn ?? ""} onValueChange={(v) => editarWidget(w.id, { valueColumn: v })}>
          <SelectTrigger aria-label="Longitude"><SelectValue placeholder="Longitude" /></SelectTrigger>
          <SelectContent>{columns.map((c) => <SelectItem key={c.key} value={c.key}>Longitude: {c.label}</SelectItem>)}</SelectContent>
        </Select>
      ) : (<>
        <Select value={w.aggregation} onValueChange={(v) => editarWidget(w.id, v === "count" ? { aggregation: "count", valueColumn: null } : { aggregation: v as DashboardWidget["aggregation"], valueColumn: w.valueColumn ?? (v === "unique" ? columns[0]?.key : nums[0]?.key) ?? null })}>
          <SelectTrigger aria-label="Cálculo"><SelectValue /></SelectTrigger>
          <SelectContent>{(Object.keys(AGG) as DashboardWidget["aggregation"][]).filter((a) => a === "count" || a === "unique" || nums.length).map((a) => <SelectItem key={a} value={a}>{AGG[a]}</SelectItem>)}</SelectContent>
        </Select>
        {w.aggregation !== "count" && (
          <Select value={w.valueColumn ?? ""} onValueChange={(v) => editarWidget(w.id, { valueColumn: v })}>
            <SelectTrigger aria-label="Coluna de valor"><SelectValue placeholder="Coluna de valor" /></SelectTrigger>
            <SelectContent>{(w.aggregation === "unique" ? columns : nums).map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        )}
        {w.chartType !== "kpi" && <Input aria-label="Máximo de categorias" type="number" min={1} max={200} value={w.itemLimit} onChange={(e) => editarWidget(w.id, { itemLimit: Math.max(1, Math.min(200, Number(e.target.value) || 10)) })} />}
      </>)}
    </div>
  );
}

const SPAN = { 1: "xl:col-span-1", 2: "md:col-span-2 xl:col-span-2", 3: "md:col-span-2 xl:col-span-3" } as const;
type Arraste = { index: number; total: number; arrastando: boolean; sobre: boolean; onDragStart: () => void; onDragEnter: () => void; onDrop: () => void; onDragEnd: () => void };
type Drill = (titulo: string, regs: DataRecord[]) => void;

function Painel({ w, data, total, columns, dnd, drill }: { w: DashboardWidget; data: DataRecord[]; total: number; columns: DataColumn[]; dnd: Arraste; drill: Drill }) {
  const [editando, setEditando] = useState(false);
  const h = w.layout.h;
  const onPick = (n: string) => drill(`${w.title} — ${n}`, registrosDe(data, w, n, columns));
  return (
    <div
      onDragEnter={dnd.onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); dnd.onDrop(); }}
      className={`panel panel-hover flex min-w-0 flex-col rounded-xl p-4 transition sm:p-5 ${SPAN[w.layout.w]} ${dnd.arrastando ? "opacity-50" : ""} ${dnd.sobre ? "ring-2 ring-primary" : ""}`}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; dnd.onDragStart(); }} onDragEnd={dnd.onDragEnd} className="flex min-w-0 cursor-grab items-center gap-1.5" title="Arraste para mover">
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="shrink-0 rounded bg-secondary px-1.5 text-xs text-secondary-foreground">{dnd.index + 1}</span>
          <h2 className="font-display min-w-0 truncate text-base font-semibold">{w.title}</h2>
        </div>
        <div className="flex shrink-0 flex-wrap gap-0.5">
          <Button size="icon" variant="ghost" aria-label="Mover para cima" disabled={dnd.index === 0} onClick={() => moverWidget(w.id, dnd.index - 1)}><ArrowUp /></Button>
          <Button size="icon" variant="ghost" aria-label="Mover para baixo" disabled={dnd.index === dnd.total - 1} onClick={() => moverWidget(w.id, dnd.index + 1)}><ArrowDown /></Button>
          <Button size="icon" variant="ghost" aria-label="Mais estreito" disabled={w.layout.w === 1} onClick={() => editarWidget(w.id, { layout: { ...w.layout, w: (w.layout.w - 1) as 1 | 2 } })}><Minimize2 /></Button>
          <Button size="icon" variant="ghost" aria-label="Mais largo" disabled={w.layout.w === 3} onClick={() => editarWidget(w.id, { layout: { ...w.layout, w: (w.layout.w + 1) as 2 | 3 } })}><Maximize2 /></Button>
          <Button size="icon" variant={w.isFeatured ? "default" : "ghost"} aria-label="Destacar" aria-pressed={w.isFeatured} onClick={() => editarWidget(w.id, { isFeatured: !w.isFeatured })}><Star /></Button>
          <Button size="icon" variant="ghost" aria-label={w.isVisible ? "Ocultar" : "Exibir"} onClick={() => editarWidget(w.id, { isVisible: !w.isVisible })}>{w.isVisible ? <Eye /> : <EyeOff />}</Button>
          <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => excluirWidget(w.id)}><Trash2 /></Button>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-foreground">{data.length === total ? `${fmtNum(total)} registros analisados` : `${fmtNum(data.length)} de ${fmtNum(total)} registros`}</span>
        <button type="button" className="underline-offset-2 hover:underline" onClick={() => setEditando((v) => !v)}>{editando ? "Fechar configuração" : "Configurar"}</button>
      </div>
      {editando && <Editor w={w} columns={columns} />}
      {w.isVisible && <div className="relative mt-3 min-w-0" style={{ height: w.chartType === "kpi" ? Math.min(h, 200) : h }}>
        <Componente w={w} data={data} columns={columns} onPick={onPick} onAll={() => drill(w.title, data)} />
        {w.chartType !== "kpi" && <div role="separator" aria-label="Redimensionar altura" title="Arraste para ajustar a altura" className="absolute -bottom-2 left-1/2 h-2 w-16 -translate-x-1/2 cursor-ns-resize rounded bg-border hover:bg-primary" onPointerDown={(e) => {
          const y0 = e.clientY; const el = e.currentTarget.parentElement!; let nh = h;
          const mv = (ev: PointerEvent) => { nh = Math.max(240, Math.min(720, h + ev.clientY - y0)); el.style.height = `${nh}px`; };
          const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); void editarWidget(w.id, { layout: { ...w.layout, h: Math.round(nh) } }); };
          window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
        }} />}
      </div>}
    </div>
  );
}

function csv(regs: DataRecord[], columns: DataColumn[]) {
  const esc = (t: string) => /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  const linhas = [columns.map((c) => esc(c.label)).join(";"), ...regs.map((r) => columns.map((c) => esc(cellText(r.data[c.key]))).join(";"))];
  const url = URL.createObjectURL(new Blob(["\ufeff" + linhas.join("\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = "registros.csv"; a.click(); URL.revokeObjectURL(url);
}

function DrillDialog({ alvo, columns, onClose }: { alvo: { titulo: string; regs: DataRecord[] } | null; columns: DataColumn[]; onClose: () => void }) {
  const [q, setQ] = useState(""); const [pag, setPag] = useState(0); const POR = 50;
  const regs = useMemo(() => { const t = q.trim().toLowerCase(); return !alvo ? [] : t ? alvo.regs.filter((r) => Object.values(r.data).some((v) => cellText(v).toLowerCase().includes(t))) : alvo.regs; }, [alvo, q]);
  const paginas = Math.max(1, Math.ceil(regs.length / POR)); const p = Math.min(pag, paginas - 1);
  return (
    <Dialog open={!!alvo} onOpenChange={(o) => { if (!o) { onClose(); setQ(""); setPag(0); } }}>
      <DialogContent className="max-h-[90vh] max-w-[min(96vw,1100px)] overflow-hidden">
        <DialogHeader><DialogTitle className="font-display">{alvo?.titulo} — {fmtNum(alvo?.regs.length ?? 0)} registros</DialogTitle></DialogHeader>
        <div className="flex flex-wrap gap-2"><Input value={q} onChange={(e) => { setQ(e.target.value); setPag(0); }} placeholder="Buscar nestes registros…" className="min-w-0 flex-1" /><Button variant="outline" onClick={() => csv(regs, columns)}><Download />CSV ({fmtNum(regs.length)})</Button></div>
        <div className="max-h-[60vh] overflow-auto rounded-md border border-border">
          <table className="w-full text-xs"><thead className="sticky top-0 bg-card"><tr><th className="p-2 text-left">#</th>{columns.map((c) => <th key={c.key} className="whitespace-nowrap p-2 text-left">{c.label}</th>)}</tr></thead>
            <tbody>{regs.slice(p * POR, p * POR + POR).map((r, i) => <tr key={r.id} className="border-t border-border"><td className="p-2 text-muted-foreground">{p * POR + i + 1}</td>{columns.map((c) => <td key={c.key} className="max-w-64 truncate p-2">{cellText(r.data[c.key])}</td>)}</tr>)}</tbody></table>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Página {p + 1} de {paginas}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={p === 0} onClick={() => setPag(p - 1)}>Anterior</Button><Button size="sm" variant="outline" disabled={p >= paginas - 1} onClick={() => setPag(p + 1)}>Próxima</Button></div></div>
      </DialogContent>
    </Dialog>
  );
}

function Modelos({ data, columns }: { data: DataRecord[]; columns: DataColumn[] }) {
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  const perfil = useMemo(() => open ? perfilBase(data, columns) : null, [open, data, columns]);
  const aplicar = async (lista: ReturnType<typeof sugestoes>) => { setBusy(true); try { await aplicarSugestoes(lista); setOpen(false); } finally { setBusy(false); } };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><LayoutTemplate />Modelos</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-[min(96vw,900px)] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Biblioteca de modelos</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Cada modelo usa apenas os campos detectados na sua base. Os componentes são adicionados ao final e podem ser editados, movidos e redimensionados.</p>
        {perfil && <>
          <Button disabled={busy} onClick={() => aplicar(sugestoes(perfil))} className="w-full sm:w-auto"><Sparkles />Sugestões automáticas ({sugestoes(perfil).length})</Button>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{MODELOS.map((m) => { const itens = montarModelo(m.id, perfil); return (
            <button key={m.id} type="button" disabled={busy || !itens.length} onClick={() => aplicar(itens)} className="panel panel-hover rounded-lg p-3 text-left disabled:opacity-50">
              <p className="font-display font-semibold">{m.nome}</p><p className="mt-1 text-xs text-muted-foreground">{m.descricao}</p><p className="mt-2 text-xs text-primary">{itens.length ? `${itens.length} componentes` : "Sem campos compatíveis"}</p>
            </button>); })}</div>
        </>}
      </DialogContent>
    </Dialog>
  );
}

function PerfilBase({ data, columns }: { data: DataRecord[]; columns: DataColumn[] }) {
  const [open, setOpen] = useState(false);
  const p = useMemo(() => open ? perfilBase(data, columns) : null, [open, data, columns]);
  const PAPEL: Record<string, string> = { uf: "UF", municipio: "Município", regiao: "Região", pais: "País", lat: "Latitude", lng: "Longitude", data: "Data", numero: "Número", categoria: "Categoria", texto: "Texto livre" };
  return (
    <section className="panel rounded-xl p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="font-display flex w-full items-center justify-between text-left font-semibold"><span>Perfil da base</span><span className="text-xs text-muted-foreground">{open ? "Recolher" : "Ver leitura completa"}</span></button>
      {p && <div className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6">{[["Registros", p.registros], ["Colunas", p.colunas], ["Células", p.celulas], ["Preenchidas", p.preenchidas], ["Vazias", p.vazias], ["Linhas duplicadas", p.duplicadas]].map(([l, v]) => <div key={String(l)} className="rounded-md bg-secondary/40 p-2"><p className="text-[11px] uppercase text-muted-foreground">{l}</p><p className="font-display text-lg font-semibold tabular-nums">{fmtNum(Number(v))}</p></div>)}</div>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead className="text-left text-muted-foreground"><tr><th className="p-1.5">Campo</th><th>Tipo detectado</th><th className="text-right">Preenchidos</th><th className="text-right">Vazios</th><th className="text-right">Únicos</th><th className="pl-3">Mais frequentes</th></tr></thead>
          <tbody>{p.cols.map((c) => <tr key={c.col.key} className="border-t border-border"><td className="p-1.5 font-medium">{c.col.label}</td><td>{PAPEL[c.papel]}</td><td className="text-right tabular-nums">{fmtNum(c.preenchidos)}</td><td className="text-right tabular-nums">{fmtNum(c.vazios)}</td><td className="text-right tabular-nums">{fmtNum(c.unicos)}</td><td className="max-w-72 truncate pl-3 text-muted-foreground">{c.top.slice(0, 3).map((t) => `${t.name} (${fmtNum(t.total)})`).join(" · ")}</td></tr>)}</tbody></table></div>
      </div>}
    </section>
  );
}

function Dashboards() {
  const { data, dataset, widgets, filters, textos } = useRelmeg();
  const [arrastado, setArrastado] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<{ titulo: string; regs: DataRecord[] } | null>(null);
  const columns = dataset?.columns ?? [];
  const filtrados = useMemo(() => aplicarFiltros(data, filters), [data, filters]);
  const destaques = widgets.filter((w) => w.isFeatured && w.isVisible);
  const drill: Drill = (titulo, regs) => setAlvo({ titulo, regs });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{textos.dashboardsTitulo}</h1>
          <p className="text-sm text-muted-foreground">{textos.dashboardsSubtitulo}</p>
        </div>
        {dataset && (
          <div className="flex flex-wrap gap-2">
            <Modelos data={data} columns={columns} />
            <Button variant="outline" onClick={() => adicionarWidget()}><Plus />Novo componente</Button>
            <FichaDialog data={filtrados} columns={columns} widgets={widgets.filter((w) => !["kpi", "table", "map_uf", "map_points"].includes(w.chartType))} filters={filters} />
          </div>
        )}
      </div>
      {!dataset || !data.length ? (
        <EmptyState titulo="Sem dados para analisar" descricao="Importe qualquer planilha CSV ou Excel no painel Admin para montar seus dashboards." />
      ) : (
        <>
          <button type="button" onClick={() => drill("Registros na seleção atual", filtrados)} className="block w-full text-left"><KpiCards data={filtrados} columns={columns} /></button>
          <FilterBar data={data} columns={columns} />
          <PerfilBase data={filtrados} columns={columns} />
          {destaques.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display flex items-center gap-2 text-lg font-semibold"><Star className="h-4 w-4 text-primary" />Destaques</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {destaques.map((w) => (
                  <div key={w.id} className={`panel glow-ring min-w-0 rounded-xl p-4 sm:p-5 ${SPAN[w.layout.w]}`}>
                    <h3 className="font-display mb-1 font-semibold">{w.title}</h3>
                    <p className="mb-3 text-xs text-muted-foreground">{fmtNum(filtrados.length)} registros analisados</p>
                    <div style={{ height: w.chartType === "kpi" ? 160 : w.layout.h }}><Componente w={w} data={filtrados} columns={columns} onPick={(n) => drill(`${w.title} — ${n}`, registrosDe(filtrados, w, n, columns))} onAll={() => drill(w.title, filtrados)} /></div>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Todos os componentes</h2>
            {widgets.length === 0 ? (
              <div className="panel rounded-xl p-10 text-center text-sm text-muted-foreground">Nenhum componente ainda. Use "Modelos" ou "Novo componente" para começar.</div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Arraste pelo título para mover, use os botões de largura e a alça inferior para redimensionar. Clique em barras, fatias, estados, linhas de tabela ou KPIs para ver os registros de origem.</p>
                <div className="grid grid-flow-dense gap-4 md:grid-cols-2 xl:grid-cols-3">{widgets.map((w, i) => (
                  <Painel key={w.id} w={w} data={filtrados} total={data.length} columns={columns} drill={drill} dnd={{
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
      <DrillDialog alvo={alvo} columns={columns} onClose={() => setAlvo(null)} />
    </div>
  );
}
