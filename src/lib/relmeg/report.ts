
/* --------------------------------- Logo ---------------------------------- */

const LOGO_SVG = (cor: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="192" height="192">
  <path d="M4 34h40" stroke="${cor}" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>
  <path d="M6 30c0-4.4 4.9-8 11-8s11 3.6 11 8" stroke="${cor}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M42 30c0-3.3-3.1-6-7-6s-7 2.7-7 6" stroke="${cor}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.65"/>
  <rect x="20" y="6" width="3" height="24" rx="1.5" fill="${cor}"/>
  <rect x="25.5" y="12" width="3" height="18" rx="1.5" fill="${cor}" opacity="0.7"/>
  <circle cx="21.5" cy="4" r="2.5" fill="${cor}"/>
  <circle cx="27" cy="10" r="2" fill="${cor}" opacity="0.7"/>
  <path d="M8 42h32" stroke="${cor}" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
</svg>`;

export async function logoPng(cor = "#ffffff"): Promise<string> {
  const svg = LOGO_SVG(cor);
  const url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  const img = new Image();
  img.src = url;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 192;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, 192, 192);
  return canvas.toDataURL("image/png");
}
import type { DataColumn, DataRecord, DashboardWidget, Filters, CellValue } from "./types";
import { cellText, recordTitle } from "./types";

export type FichaConfig = { titulo: string; subtitulo: string; incluirFiltros: boolean; incluirIndicadores: boolean; incluirGraficos: boolean; campos: string[]; limite: number };
export const FICHA_PADRAO: FichaConfig = { titulo: "Ficha de estudo", subtitulo: "", incluirFiltros: true, incluirIndicadores: true, incluirGraficos: true, campos: [], limite: 30 };

export function agregar(data: DataRecord[], w: Pick<DashboardWidget, "categoryColumn" | "valueColumn" | "aggregation" | "itemLimit">) {
  const g = new Map<string, number[]>();
  for (const r of data) {
    const cat = cellText(r.data[w.categoryColumn]).trim(); if (!cat) continue;
    const raw: CellValue | undefined = w.valueColumn ? r.data[w.valueColumn] : 1;
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!g.has(cat)) g.set(cat, []);
    if (w.aggregation === "count" || Number.isFinite(n)) g.get(cat)!.push(w.aggregation === "count" ? 1 : n);
  }
  const f = (v: number[]) => !v.length ? 0 : w.aggregation === "sum" || w.aggregation === "count" ? v.reduce((a, b) => a + b, 0) : w.aggregation === "average" ? v.reduce((a, b) => a + b, 0) / v.length : w.aggregation === "min" ? Math.min(...v) : Math.max(...v);
  return [...g.entries()].map(([name, v]) => ({ name, total: Math.round(f(v) * 100) / 100 })).sort((a, b) => b.total - a.total).slice(0, w.itemLimit || 10);
}
export function filtrosAtivos(filters: Filters, columns: DataColumn[]) {
  const out: string[] = []; if (filters.busca) out.push(`Busca: ${filters.busca}`);
  for (const [k, v] of Object.entries(filters.campos)) if (v) out.push(`${columns.find((c) => c.key === k)?.label ?? k}: ${v}`);
  return out;
}
const hoje = () => new Date().toLocaleDateString("pt-BR");
const arquivo = (c: FichaConfig, ext: string) => `${(c.titulo || "ficha").normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase()}.${ext}`;
const linhas = (r: DataRecord, cols: DataColumn[], campos: string[]) => cols.filter((c) => !campos.length || campos.includes(c.key)).map((c) => `${c.label}: ${cellText(r.data[c.key]) || "—"}`);

type Args = { config: FichaConfig; data: DataRecord[]; columns: DataColumn[]; widgets: DashboardWidget[]; filters: Filters };
export async function gerarPdf({ config, data, columns, widgets, filters }: Args) {
  const { jsPDF } = await import("jspdf"); const doc = new jsPDF(); const logo = await logoPng("#1e3a8a");
  let y = 0; const header = () => { doc.addImage(logo, "PNG", 14, 8, 12, 12); doc.setFontSize(10); doc.setTextColor(30, 58, 138); doc.text("RelMeg", 30, 16); doc.setTextColor(20); y = 30; };
  const line = (t: string, size = 10) => { doc.setFontSize(size); for (const l of doc.splitTextToSize(t, 180) as string[]) { if (y > 280) { doc.addPage(); header(); } doc.text(l, 14, y); y += size * 0.5; } };
  header(); line(config.titulo, 18); if (config.subtitulo) line(config.subtitulo, 11); line(`Gerado em ${hoje()} · ${data.length} registros`, 9); y += 4;
  if (config.incluirFiltros) { const f = filtrosAtivos(filters, columns); line("Filtros: " + (f.join("; ") || "nenhum"), 9); y += 3; }
  if (config.incluirIndicadores) { line("Indicadores", 13); line(`Registros: ${data.length} · Colunas: ${columns.length}`); y += 3; }
  if (config.incluirGraficos) for (const w of widgets.filter((x) => x.isVisible)) { line(w.title, 13); for (const d of agregar(data, w)) line(`• ${d.name}: ${d.total}`); y += 3; }
  line("Registros", 13);
  for (const r of data.slice(0, config.limite)) { y += 2; line(recordTitle(r, columns), 11); for (const l of linhas(r, columns, config.campos)) line(l, 9); }
  doc.save(arquivo(config, "pdf"));
}
export async function gerarPptx({ config, data, columns, widgets, filters }: Args) {
  const P = (await import("pptxgenjs")).default; const p = new P(); p.layout = "LAYOUT_WIDE"; const logo = await logoPng("#1e3a8a");
  const slide = (t: string) => { const s = p.addSlide(); s.addImage({ data: logo, x: 0.3, y: 0.2, w: 0.5, h: 0.5 }); s.addText(t, { x: 1, y: 0.2, w: 11.5, h: 0.6, fontSize: 22, bold: true, color: "1E3A8A" }); return s; };
  const capa = slide(config.titulo); capa.addText([config.subtitulo, `Gerado em ${hoje()} · ${data.length} registros`, config.incluirFiltros ? "Filtros: " + (filtrosAtivos(filters, columns).join("; ") || "nenhum") : ""].filter(Boolean).join("\n"), { x: 1, y: 1.5, w: 11, h: 3, fontSize: 16, color: "333333" });
  if (config.incluirGraficos) for (const w of widgets.filter((x) => x.isVisible)) { const d = agregar(data, w); if (!d.length) continue; const s = slide(w.title); s.addChart(w.chartType === "pie" ? p.ChartType.pie : w.chartType === "line" ? p.ChartType.line : p.ChartType.bar, [{ name: w.title, labels: d.map((x) => x.name), values: d.map((x) => x.total) }], { x: 0.8, y: 1.1, w: 11.5, h: 5.8, showLegend: w.chartType === "pie" }); }
  for (const r of data.slice(0, config.limite)) slide(recordTitle(r, columns)).addText(linhas(r, columns, config.campos).join("\n"), { x: 0.8, y: 1.1, w: 11.5, h: 6, fontSize: 12, color: "222222", valign: "top", fit: "shrink" });
  await p.writeFile({ fileName: arquivo(config, "pptx") });
}
