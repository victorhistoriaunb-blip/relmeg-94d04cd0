import { agregar as motorAgregar } from "./engine";

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
import { cellText } from "./types";

export type FichaConfig = { titulo: string; subtitulo: string; incluirCapa: boolean; incluirFiltros: boolean; incluirIndicadores: boolean; incluirGraficos: boolean; incluirPerfis: boolean; campos: string[]; limite: number };
export const FICHA_PADRAO: FichaConfig = { titulo: "Ficha de Estudo", subtitulo: "RelMeg — Inteligência Legislativa", incluirCapa: true, incluirFiltros: true, incluirIndicadores: true, incluirGraficos: true, incluirPerfis: true, campos: [], limite: 50 };

export function agregar(data: DataRecord[], w: Pick<DashboardWidget, "categoryColumn" | "valueColumn" | "aggregation" | "itemLimit">, columns?: DataColumn[]) { return motorAgregar(data, w, { columns, outros: true, vazios: false }); }
export function filtrosAtivos(filters: Filters, columns: DataColumn[]) {
  const out: { label: string; valor: string }[] = []; if (filters.busca) out.push({ label: "Busca", valor: filters.busca });
  for (const [k, v] of Object.entries(filters.campos)) if (v) out.push({ label: columns.find((c) => c.key === k)?.label ?? k, valor: v });
  return out;
}
/** Indicadores genéricos: total + valor predominante das colunas categóricas mais relevantes. */
export function indicadores(data: DataRecord[], columns: DataColumn[], widgets: DashboardWidget[]) {
  const out = [{ label: "Total de registros", valor: String(data.length), nota: "no recorte filtrado" }];
  const chaves = [...new Set([...widgets.filter((w) => w.isVisible).map((w) => w.categoryColumn), ...columns.filter((c) => c.type === "text").map((c) => c.key)])];
  for (const key of chaves) {
    if (out.length >= 5) break;
    const col = columns.find((c) => c.key === key); if (!col) continue;
    const distintos = new Set(data.map((r) => cellText(r.data[key])).filter(Boolean));
    if (distintos.size < 2 || distintos.size > Math.max(30, data.length * 0.6)) continue;
    const top = agregar(data, { categoryColumn: key, valueColumn: null, aggregation: "count", itemLimit: 1 })[0];
    if (top) out.push({ label: `${col.label} predominante`, valor: top.name, nota: `${top.total} registros` });
  }
  const num = columns.find((c) => c.type === "number");
  if (num && out.length < 6) { const v = data.map((r) => r.data[num.key]).filter((x): x is number => typeof x === "number"); if (v.length) out.push({ label: `Soma de ${num.label}`, valor: (Math.round(v.reduce((a, b) => a + b, 0) * 100) / 100).toLocaleString("pt-BR"), nota: `média ${(v.reduce((a, b) => a + b, 0) / v.length).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}` }); }
  return out;
}
const dataHoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const nomeArquivo = (c: FichaConfig, ext: string) => `${(c.titulo || "ficha").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "ficha"}-${new Date().toISOString().slice(0, 10)}.${ext}`;
const fmt = (v: CellValue | undefined) => { const t = cellText(v); if (/^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{2} \d{4} \d{2}:\d{2}/.test(t)) { const d = new Date(t); if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("pt-BR"); } return t; };
const linhasDe = (r: DataRecord, cols: DataColumn[], campos: string[], titulo: string) => cols.filter((c) => (!campos.length || campos.includes(c.key)) && c.key !== titulo).map((c) => ({ rotulo: c.label, texto: fmt(r.data[c.key]) })).filter((l) => l.texto.trim());
const tituloDe = (r: DataRecord, cols: DataColumn[], tk: string) => { if (cellText(r.data[tk]).trim()) return tituloRegistro(r, tk); const nome = cols.find((c) => c.key !== "__planilha" && /^(nome|name|titulo|título|title)$/i.test(c.label) && cellText(r.data[c.key]).trim()) ?? cols.find((c) => c.key !== "__planilha" && cellText(r.data[c.key]).trim()); return nome ? tituloRegistro(r, nome.key) : "Registro sem título"; };
const tituloRegistro = (r: DataRecord, k: string) => fmt(r.data[k]);
const tituloKey = (cols: DataColumn[]) => (cols.find((c) => /^(nome|name|titulo|título|title)$/i.test(c.label)) ?? cols.find((c) => c.key !== "__planilha") ?? cols[0])?.key ?? "";

type Args = { config: FichaConfig; data: DataRecord[]; columns: DataColumn[]; widgets: DashboardWidget[]; filters: Filters };

const NAVY: [number, number, number] = [22, 33, 62];
const AZUL: [number, number, number] = [58, 110, 220];
const TEXTO: [number, number, number] = [28, 32, 42];
const CINZA: [number, number, number] = [96, 104, 120];
const PALETA_RGB: [number, number, number][] = [[58, 110, 220], [42, 169, 198], [24, 140, 110], [124, 107, 232], [91, 141, 239], [200, 62, 62]];

export async function gerarPdf({ config, data, columns, widgets, filters }: Args) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const logo = await logoPng("#ffffff");
  const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight(); const M = 40;
  let y = 0; let pagina = 0;
  const cabecalho = () => {
    doc.setFillColor(...NAVY); doc.rect(0, 0, W, 54, "F"); doc.addImage(logo, "PNG", M, 13, 28, 28);
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("RelMeg", M + 36, 27);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(196, 208, 235); doc.text("Inteligência Legislativa", M + 36, 39);
    doc.text(doc.splitTextToSize(config.titulo, 240)[0] ?? "", W - M, 33, { align: "right" }); y = 84;
  };
  const rodape = () => { doc.setDrawColor(220, 224, 232); doc.setLineWidth(0.5); doc.line(M, H - 38, W - M, H - 38); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...CINZA); doc.text(`${config.subtitulo ? config.subtitulo + " • " : ""}${dataHoje()}`, M, H - 24); doc.text(`Página ${pagina}`, W - M, H - 24, { align: "right" }); };
  const novaPagina = () => { if (pagina > 0) rodape(); if (pagina > 0 || config.incluirCapa) doc.addPage(); pagina += 1; cabecalho(); };
  const espaco = (h: number) => { if (y + h > H - 56) novaPagina(); };
  const titulo = (t: string) => { espaco(40); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...NAVY); doc.text(t, M, y); doc.setDrawColor(...AZUL); doc.setLineWidth(2); doc.line(M, y + 6, M + 34, y + 6); doc.setLineWidth(0.5); y += 24; };

  if (config.incluirCapa) {
    doc.setFillColor(...NAVY); doc.rect(0, 0, W, H, "F"); doc.addImage(logo, "PNG", M, 90, 64, 64);
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(30); const tl = doc.splitTextToSize(config.titulo, W - M * 2) as string[]; doc.text(tl, M, 230);
    const base = 230 + tl.length * 32;
    doc.setFont("helvetica", "normal"); doc.setFontSize(13); doc.setTextColor(186, 202, 236); if (config.subtitulo) doc.text(config.subtitulo, M, base);
    doc.setDrawColor(...AZUL); doc.setLineWidth(3); doc.line(M, base + 20, M + 90, base + 20); doc.setLineWidth(0.5);
    doc.setFontSize(11); doc.setTextColor(226, 234, 250); doc.text(`${data.length} registros no recorte`, M, base + 60); doc.text(dataHoje(), M, base + 80);
  }
  novaPagina();

  if (config.incluirFiltros) {
    const ativos = filtrosAtivos(filters, columns); titulo("Filtros aplicados");
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...TEXTO);
    if (!ativos.length) { doc.text("Nenhum filtro aplicado — base completa.", M, y); y += 16; }
    else ativos.forEach((f) => { espaco(16); doc.setFont("helvetica", "bold"); doc.text(`${f.label}:`, M, y); doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(f.valor, W - M * 2 - 130)[0] ?? "", M + 130, y); y += 16; });
    y += 8;
  }
  if (config.incluirIndicadores) {
    titulo("Indicadores"); const cards = indicadores(data, columns, widgets); const lg = (W - M * 2 - 12) / 2;
    cards.forEach((c, i) => {
      if (i % 2 === 0) espaco(64); const x = M + (i % 2) * (lg + 12); const l = y;
      doc.setFillColor(244, 247, 252); doc.setDrawColor(224, 231, 242); doc.roundedRect(x, l - 12, lg, 54, 6, 6, "FD");
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...CINZA); doc.text((doc.splitTextToSize(c.label.toUpperCase(), lg - 20)[0] ?? ""), x + 10, l + 2);
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...NAVY); doc.text(doc.splitTextToSize(c.valor, lg - 20)[0] ?? "—", x + 10, l + 20);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...CINZA); doc.text(c.nota, x + 10, l + 34);
      if (i % 2 === 1) y += 66;
    });
    if (cards.length % 2 === 1) y += 66;
  }
  if (config.incluirGraficos) for (const [wi, w] of widgets.filter((x) => x.isVisible).entries()) {
    const dados = agregar(data, w); if (!dados.length) continue;
    titulo(w.title); const max = Math.max(...dados.map((d) => Math.abs(d.total)), 1); const cor = PALETA_RGB[wi % PALETA_RGB.length]!;
    dados.forEach((d) => {
      espaco(24); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...TEXTO); doc.text(doc.splitTextToSize(d.name, 150)[0] ?? "", M, y + 9);
      const base = M + 160; const total = W - M - base - 44;
      doc.setFillColor(236, 240, 247); doc.roundedRect(base, y, total, 12, 3, 3, "F");
      doc.setFillColor(...cor); doc.roundedRect(base, y, Math.max(3, (Math.abs(d.total) / max) * total), 12, 3, 3, "F");
      doc.setTextColor(...CINZA); doc.text(d.total.toLocaleString("pt-BR"), W - M, y + 9, { align: "right" }); y += 20;
    });
    y += 10;
  }
  if (config.incluirPerfis) {
    const tk = tituloKey(columns); const lista = data.slice(0, config.limite);
    titulo(`Fichas individuais (${lista.length})`);
    lista.forEach((r) => {
      espaco(60); doc.setFillColor(...NAVY); doc.roundedRect(M, y - 12, W - M * 2, 22, 4, 4, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(255, 255, 255); doc.text(doc.splitTextToSize(tituloDe(r, columns, tk), W - M * 2 - 20)[0] ?? "", M + 10, y + 3); y += 24;
      linhasDe(r, columns, config.campos, tk).forEach((l) => {
        const t = doc.splitTextToSize(l.texto, W - M * 2 - 130) as string[]; espaco(14 + t.length * 12);
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...CINZA); doc.text(doc.splitTextToSize(l.rotulo, 120) as string[], M, y);
        doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXTO); doc.text(t, M + 130, y); y += Math.max(14, t.length * 12) + 2;
      });
      y += 12;
    });
  }
  rodape();
  doc.save(nomeArquivo(config, "pdf"));
}

const HEX_NAVY = "16213E"; const HEX_AZUL = "3A6EDC"; const HEX_TEXTO = "1C202A"; const HEX_CINZA = "606878";
const PALETA_HEX = ["3A6EDC", "2AA9C6", "188C6E", "7C6BE8", "5B8DEF", "C83E3E", "8FB3F5", "4CC3A5"];

export async function gerarPptx({ config, data, columns, widgets, filters }: Args) {
  const P = (await import("pptxgenjs")).default; const pptx = new P(); pptx.layout = "LAYOUT_16x9";
  const logo = await logoPng("#ffffff");
  const novoSlide = (titulo?: string) => {
    const s = pptx.addSlide(); s.background = { color: "FFFFFF" };
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.62, fill: { color: HEX_NAVY } });
    s.addImage({ data: logo, x: 0.35, y: 0.11, w: 0.4, h: 0.4 });
    s.addText("RelMeg", { x: 0.85, y: 0.11, w: 3, h: 0.4, fontSize: 14, bold: true, color: "FFFFFF" });
    s.addText(config.titulo, { x: 5.5, y: 0.11, w: 4.2, h: 0.4, fontSize: 10, color: "C4D0EB", align: "right" });
    if (titulo) { s.addText(titulo, { x: 0.5, y: 0.85, w: 9, h: 0.5, fontSize: 24, bold: true, color: HEX_NAVY, fit: "shrink" }); s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.35, w: 0.7, h: 0.05, fill: { color: HEX_AZUL } }); }
    s.addText(`${config.subtitulo ? config.subtitulo + " • " : ""}${dataHoje()}`, { x: 0.5, y: 5.2, w: 9, h: 0.3, fontSize: 8, color: HEX_CINZA });
    return s;
  };
  if (config.incluirCapa) {
    const c = pptx.addSlide(); c.background = { color: HEX_NAVY };
    c.addImage({ data: logo, x: 0.6, y: 0.7, w: 0.9, h: 0.9 });
    c.addText(config.titulo, { x: 0.6, y: 1.9, w: 8.8, h: 1.1, fontSize: 34, bold: true, color: "FFFFFF", fit: "shrink" });
    if (config.subtitulo) c.addText(config.subtitulo, { x: 0.6, y: 3.0, w: 8.8, h: 0.4, fontSize: 15, color: "BACAEC" });
    c.addShape(pptx.ShapeType.rect, { x: 0.6, y: 3.5, w: 1.2, h: 0.06, fill: { color: HEX_AZUL } });
    c.addText(`${data.length} registros • ${dataHoje()}`, { x: 0.6, y: 3.8, w: 8.8, h: 0.4, fontSize: 12, color: "E2EAFA" });
  }
  if (config.incluirFiltros) {
    const s = novoSlide("Filtros aplicados"); const a = filtrosAtivos(filters, columns);
    s.addText(a.length ? a.map((f) => ({ text: `${f.label}: ${f.valor}`, options: { bullet: true, breakLine: true } })) : [{ text: "Nenhum filtro aplicado — base completa." }], { x: 0.6, y: 1.7, w: 8.8, h: 3.4, fontSize: 16, color: HEX_TEXTO, valign: "top" });
  }
  if (config.incluirIndicadores) {
    const s = novoSlide("Indicadores");
    indicadores(data, columns, widgets).slice(0, 6).forEach((c, i) => {
      const x = 0.6 + (i % 2) * 4.5; const yy = 1.6 + Math.floor(i / 2) * 1.15;
      s.addShape(pptx.ShapeType.roundRect, { x, y: yy, w: 4.1, h: 1.0, fill: { color: "F4F7FC" }, line: { color: "E0E7F2" }, rectRadius: 0.08 });
      s.addText(c.label.toUpperCase(), { x: x + 0.2, y: yy + 0.05, w: 3.7, h: 0.28, fontSize: 9, color: HEX_CINZA });
      s.addText(c.valor, { x: x + 0.2, y: yy + 0.3, w: 3.7, h: 0.4, fontSize: 17, bold: true, color: HEX_NAVY, fit: "shrink" });
      s.addText(c.nota, { x: x + 0.2, y: yy + 0.68, w: 3.7, h: 0.26, fontSize: 9, color: HEX_CINZA });
    });
  }
  if (config.incluirGraficos) for (const [wi, w] of widgets.filter((x) => x.isVisible).entries()) {
    const d = agregar(data, w); if (!d.length) continue;
    const s = novoSlide(w.title);
    const t = w.chartType;
    const tipo = t === "pie" ? pptx.ChartType.pie : t === "donut" || t === "radial" ? pptx.ChartType.doughnut : t === "line" || t === "stacked" ? pptx.ChartType.line : t === "area" ? pptx.ChartType.area : t === "radar" ? pptx.ChartType.radar : t === "scatter" ? pptx.ChartType.line : pptx.ChartType.bar;
    const circular = tipo === pptx.ChartType.pie || tipo === pptx.ChartType.doughnut;
    s.addChart(tipo, [{ name: w.title, labels: d.map((x) => x.name), values: d.map((x) => x.total) }], {
      x: 0.6, y: 1.55, w: 8.8, h: 3.55, chartColors: circular ? PALETA_HEX : [PALETA_HEX[wi % PALETA_HEX.length]!],
      showValue: true, dataLabelColor: circular || t === "bar" || t === "column" ? "FFFFFF" : HEX_TEXTO, catAxisLabelColor: HEX_TEXTO, valAxisLabelColor: HEX_TEXTO,
      showLegend: circular, legendPos: "r", legendColor: HEX_TEXTO, barDir: t === "bar" || t === "funnel" || t === "treemap" ? "bar" : "col",
    });
  }
  if (config.incluirPerfis) {
    const tk = tituloKey(columns);
    data.slice(0, config.limite).forEach((r) => {
      const rows = linhasDe(r, columns, config.campos, tk).map((l) => [
        { text: l.rotulo, options: { bold: true, color: HEX_NAVY, fill: { color: "F4F7FC" }, valign: "top" as const } },
        { text: l.texto, options: { color: HEX_TEXTO, valign: "top" as const } },
      ]);
      const nome = tituloDe(r, columns, tk);
      if (!rows.length) { novoSlide(nome); return; }
      for (let i = 0; i < rows.length; i += 9) {
        const s = novoSlide(i ? `${nome} (cont.)` : nome);
        s.addTable(rows.slice(i, i + 9).map((row) => row.map((cel) => ({ ...cel, text: cel.text.length > 420 ? cel.text.slice(0, 417) + "…" : cel.text }))), { x: 0.6, y: 1.55, w: 8.8, colW: [2.4, 6.4], fontSize: 10, border: { type: "solid", color: "E0E7F2", pt: 1 }, margin: 4 });
      }
    });
  }
  await pptx.writeFile({ fileName: nomeArquivo(config, "pptx") });
}
