/**
 * Motor único de agregação: todos os números do app (KPIs, gráficos, mapas,
 * drill-down) saem daqui e sempre sobre o conjunto completo de registros.
 */
import { cellText, type CellValue, type DashboardWidget, type DataColumn, type DataRecord, type Filters } from "./types";

export const VAZIO = "(vazio)";
export const OUTROS = "Outros";

export function toDate(v: CellValue | undefined): Date | null {
  if (v === null || v === undefined || v === "" || typeof v === "boolean") return null;
  if (typeof v === "number") { if (v > 20000 && v < 80000) return new Date(Math.round((v - 25569) * 86400000)); return null; }
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) { const y = Number(m[3]!.length === 2 ? "20" + m[3] : m[3]); const d = new Date(Date.UTC(y, Number(m[2]) - 1, Number(m[1]))); return isNaN(+d) ? null : d; }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) { const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))); return isNaN(+d) ? null : d; }
  return null;
}
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function aplicarFiltros(data: DataRecord[], filters: Filters) {
  const q = filters.busca.trim().toLowerCase();
  const campos = Object.entries(filters.campos).filter(([, v]) => v);
  const p = filters.periodo && filters.periodo.col && (filters.periodo.de || filters.periodo.ate) ? filters.periodo : null;
  return data.filter((r) => {
    for (const [k, v] of campos) { const vals = v.split("\u0001"); if (!vals.includes(cellText(r.data[k]) || VAZIO)) return false; }
    if (p) { const d = toDate(r.data[p.col]); if (!d) return false; const s = iso(d); if (p.de && s < p.de) return false; if (p.ate && s > p.ate) return false; }
    if (q && !Object.values(r.data).some((v) => cellText(v).toLowerCase().includes(q))) return false;
    return true;
  });
}

/** Valor da categoria de um registro, respeitando colunas de data (agrupa por mês). */
export function categoria(r: DataRecord, col: DataColumn | undefined, key: string) {
  const v = r.data[key];
  if (col?.type === "date") { const d = toDate(v); return d ? iso(d).slice(0, 7) : VAZIO; }
  const t = cellText(v).trim();
  return t || VAZIO;
}

type Opts = { outros?: boolean; vazios?: boolean; columns?: DataColumn[] | undefined };
export type Ponto = { name: string; total: number; registros: number };

export function agregar(data: DataRecord[], w: Pick<DashboardWidget, "categoryColumn" | "valueColumn" | "aggregation" | "itemLimit"> & { chartType?: string }, opts: Opts = {}): Ponto[] {
  const { outros = true, vazios = true, columns } = opts;
  const col = columns?.find((c) => c.key === w.categoryColumn);
  const g = new Map<string, { vals: number[]; n: number; set: Set<string> }>();
  for (const r of data) {
    const cat = categoria(r, col, w.categoryColumn);
    if (!vazios && cat === VAZIO) continue;
    let e = g.get(cat); if (!e) { e = { vals: [], n: 0, set: new Set() }; g.set(cat, e); }
    e.n++;
    if (w.aggregation === "unique") { const t = w.valueColumn ? cellText(r.data[w.valueColumn]) : ""; if (t) e.set.add(t); continue; }
    if (w.aggregation === "count") continue;
    const raw = w.valueColumn ? r.data[w.valueColumn] : null; const n = typeof raw === "number" ? raw : Number(String(raw ?? "").replace(",", "."));
    if (raw !== null && raw !== "" && Number.isFinite(n)) e.vals.push(n);
  }
  const f = (e: { vals: number[]; n: number; set: Set<string> }) => {
    if (w.aggregation === "count") return e.n;
    if (w.aggregation === "unique") return e.set.size;
    const v = e.vals; if (!v.length) return 0;
    if (w.aggregation === "sum") return v.reduce((a, b) => a + b, 0);
    if (w.aggregation === "average") return v.reduce((a, b) => a + b, 0) / v.length;
    return w.aggregation === "min" ? v.reduce((a, b) => Math.min(a, b)) : v.reduce((a, b) => Math.max(a, b));
  };
  let out = [...g.entries()].map(([name, e]) => ({ name, total: Math.round(f(e) * 100) / 100, registros: e.n }));
  const temporal = col?.type === "date";
  out.sort(temporal ? (a, b) => a.name.localeCompare(b.name) : (a, b) => b.total - a.total);
  const lim = w.itemLimit || 10;
  if (temporal || out.length <= lim || w.chartType === "map_uf" || w.chartType === "map_brasil") return out;
  const top = out.slice(0, lim); const resto = out.slice(lim);
  if (!outros) return top;
  // "Outros" só tem significado aditivo para contagem e soma.
  if (w.aggregation === "count" || w.aggregation === "sum") {
    top.push({ name: `${OUTROS} (${resto.length})`, total: Math.round(resto.reduce((a, b) => a + b.total, 0) * 100) / 100, registros: resto.reduce((a, b) => a + b.registros, 0) });
  }
  out = top;
  return out;
}

/** Registros que compõem um ponto do gráfico (drill-down). */
export function registrosDe(data: DataRecord[], w: Pick<DashboardWidget, "categoryColumn" | "itemLimit" | "aggregation" | "valueColumn">, nome: string, columns: DataColumn[]) {
  const col = columns.find((c) => c.key === w.categoryColumn);
  if (nome.startsWith(OUTROS + " (")) {
    const top = new Set(agregar(data, w, { columns, outros: false }).map((p) => p.name));
    return data.filter((r) => !top.has(categoria(r, col, w.categoryColumn)));
  }
  return data.filter((r) => categoria(r, col, w.categoryColumn) === nome);
}

export function valorKpi(data: DataRecord[], w: Pick<DashboardWidget, "aggregation" | "valueColumn" | "categoryColumn">) {
  if (w.aggregation === "count") return data.length;
  if (w.aggregation === "unique") return new Set(data.map((r) => cellText(r.data[w.valueColumn ?? w.categoryColumn])).filter(Boolean)).size;
  const v = data.map((r) => r.data[w.valueColumn ?? ""]).map((x) => typeof x === "number" ? x : Number(String(x ?? "").replace(",", "."))).filter((n, i) => Number.isFinite(n) && data[i]!.data[w.valueColumn ?? ""] !== null && data[i]!.data[w.valueColumn ?? ""] !== "");
  if (!v.length) return 0;
  if (w.aggregation === "sum") return v.reduce((a, b) => a + b, 0);
  if (w.aggregation === "average") return v.reduce((a, b) => a + b, 0) / v.length;
  return w.aggregation === "min" ? v.reduce((a, b) => Math.min(a, b)) : v.reduce((a, b) => Math.max(a, b));
}

export const fmtNum = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/* ---------- Detecção de campos ---------- */
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
export const UFS: Record<string, string> = { AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins" };
const NOME_UF = new Map(Object.entries(UFS).map(([k, v]) => [norm(v), k]));
export function ufDe(v: CellValue | undefined): string | null {
  const t = cellText(v).trim(); if (!t) return null;
  const up = t.toUpperCase(); if (UFS[up]) return up;
  return NOME_UF.get(norm(t)) ?? null;
}
export type Papel = "uf" | "municipio" | "regiao" | "pais" | "lat" | "lng" | "data" | "numero" | "categoria" | "texto";
export function papelDe(c: DataColumn, data: DataRecord[]): Papel {
  const n = norm(c.label);
  const amostra = data.slice(0, 500).map((r) => r.data[c.key]).filter((v) => v !== null && v !== "");
  if (/^(lat|latitude)$/.test(n)) return "lat";
  if (/^(lng|lon|long|longitude)$/.test(n)) return "lng";
  if (/^(uf|estado|sigla uf|unidade federativa)$/.test(n) || (amostra.length > 0 && amostra.filter((v) => ufDe(v)).length / amostra.length > 0.8)) return "uf";
  if (/(municipio|cidade)/.test(n)) return "municipio";
  if (/^regiao/.test(n)) return "regiao";
  if (/^(pais|country)$/.test(n)) return "pais";
  if (c.type === "date" || (/(data|date|dia|periodo)/.test(n) && amostra.length > 0 && amostra.filter((v) => toDate(v)).length / amostra.length > 0.8)) return "data";
  if (c.type === "number") return "numero";
  const distintos = new Set(amostra.map((v) => cellText(v))).size;
  return distintos <= Math.max(50, amostra.length * 0.5) ? "categoria" : "texto";
}

export type PerfilColuna = { col: DataColumn; papel: Papel; preenchidos: number; vazios: number; unicos: number; top: Ponto[] };
export function perfilBase(data: DataRecord[], columns: DataColumn[]) {
  const cols: PerfilColuna[] = columns.map((col) => {
    let preenchidos = 0; const set = new Set<string>();
    for (const r of data) { const t = cellText(r.data[col.key]).trim(); if (t) { preenchidos++; set.add(t); } }
    return { col, papel: papelDe(col, data), preenchidos, vazios: data.length - preenchidos, unicos: set.size, top: agregar(data, { categoryColumn: col.key, valueColumn: null, aggregation: "count", itemLimit: 5 }, { columns, outros: false }) };
  });
  const vistos = new Set<string>(); let duplicadas = 0;
  for (const r of data) { const k = JSON.stringify(columns.map((c) => r.data[c.key] ?? null)); if (vistos.has(k)) duplicadas++; else vistos.add(k); }
  const celulas = data.length * columns.length; const preenchidas = cols.reduce((a, c) => a + c.preenchidos, 0);
  return { registros: data.length, colunas: columns.length, celulas, preenchidas, vazias: celulas - preenchidas, duplicadas, cols };
}

/* ---------- Sugestões e modelos ---------- */
export type Sugestao = Omit<Partial<DashboardWidget>, "layout"> & { categoryColumn: string; title: string; layout?: DashboardWidget["layout"] };
export function sugestoes(perfil: ReturnType<typeof perfilBase>): Sugestao[] {
  const by = (p: Papel) => perfil.cols.filter((c) => c.papel === p);
  const out: Sugestao[] = [];
  const uf = by("uf")[0]; if (uf) out.push({ title: `Registros por ${uf.col.label}`, chartType: "map_brasil", categoryColumn: uf.col.key, layout: { w: 2, h: 460 } });
  const lat = by("lat")[0], lng = by("lng")[0]; if (lat && lng) out.push({ title: "Mapa de ocorrências", chartType: "map_points", categoryColumn: lat.col.key, valueColumn: lng.col.key, layout: { w: 2, h: 420 } });
  for (const d of by("data").slice(0, 1)) out.push({ title: `Evolução mensal — ${d.col.label}`, chartType: "area", categoryColumn: d.col.key, itemLimit: 60, layout: { w: 2, h: 320 } });
  for (const c of by("categoria").filter((c) => c.unicos > 1).sort((a, b) => b.preenchidos - a.preenchidos).slice(0, 4)) out.push({ title: `Quantidade por ${c.col.label}`, chartType: c.unicos <= 6 ? "donut" : "bar", categoryColumn: c.col.key, layout: { w: 1, h: 320 } });
  for (const m of by("municipio").slice(0, 1)) out.push({ title: `Ranking por ${m.col.label}`, chartType: "bar", categoryColumn: m.col.key, itemLimit: 15, layout: { w: 1, h: 420 } });
  return out;
}

export type Modelo = { id: string; nome: string; descricao: string };
export const MODELOS: Modelo[] = [
  { id: "executivo", nome: "Executivo", descricao: "KPIs principais, tendência e as categorias mais relevantes." },
  { id: "kpis", nome: "Indicadores / KPIs", descricao: "Cartões de total, únicos e somas numéricas." },
  { id: "monitoramento", nome: "Monitoramento", descricao: "Volume diário/mensal e distribuição por fonte/categoria." },
  { id: "financeiro", nome: "Financeiro", descricao: "Somas, médias e máximos das colunas numéricas." },
  { id: "temporal", nome: "Temporal", descricao: "Evolução ao longo do tempo em linha, área e colunas." },
  { id: "geografico", nome: "Geográfico", descricao: "Mapa por UF, pontos por coordenadas e ranking de municípios." },
  { id: "categorias", nome: "Análise de categorias", descricao: "Distribuição de cada categoria com percentuais." },
  { id: "comparacao", nome: "Comparação", descricao: "Colunas e radar comparando categorias." },
  { id: "tendencias", nome: "Tendências", descricao: "Linhas de evolução e colunas + linha." },
  { id: "tabela", nome: "Tabela + gráficos", descricao: "Tabela resumo ao lado de gráficos principais." },
  { id: "midia", nome: "Mídia / monitoramento", descricao: "Volume por veículo, assunto, cliente, estado e mês." },
  { id: "volume", nome: "Grande volume", descricao: "Agregações leves (rankings e tabelas) para bases grandes." },
];

export function montarModelo(id: string, perfil: ReturnType<typeof perfilBase>): Sugestao[] {
  const by = (p: Papel) => perfil.cols.filter((c) => c.papel === p);
  const cats = by("categoria").filter((c) => c.unicos > 1).sort((a, b) => b.preenchidos - a.preenchidos);
  const nums = by("numero"); const datas = by("data"); const uf = by("uf")[0]; const mun = by("municipio")[0];
  const lat = by("lat")[0], lng = by("lng")[0]; const first = perfil.cols[0]?.col.key ?? "";
  const kpiTotal: Sugestao = { title: "Registros analisados", chartType: "kpi", aggregation: "count", categoryColumn: first, layout: { w: 1, h: 240 } };
  const tempo = (t: DashboardWidget["chartType"]): Sugestao[] => datas.slice(0, 1).map((d) => ({ title: `Evolução — ${d.col.label}`, chartType: t, categoryColumn: d.col.key, itemLimit: 60, layout: { w: 2, h: 320 } }));
  const cat = (t: DashboardWidget["chartType"], n: number, w: 1 | 2 | 3 = 1): Sugestao[] => cats.slice(0, n).map((c) => ({ title: `Quantidade por ${c.col.label}`, chartType: t, categoryColumn: c.col.key, layout: { w, h: 320 } } as Sugestao));
  const kpiNums: Sugestao[] = nums.slice(0, 2).map((c) => ({ title: `Total de ${c.col.label}`, chartType: "kpi", aggregation: "sum", valueColumn: c.col.key, categoryColumn: c.col.key, layout: { w: 1, h: 240 } }));
  const kpiUnicos: Sugestao[] = cats.slice(0, 2).map((c) => ({ title: `${c.col.label} distintos`, chartType: "kpi", aggregation: "unique", valueColumn: c.col.key, categoryColumn: c.col.key, layout: { w: 1, h: 240 } }));
  const geo: Sugestao[] = [
    ...(uf ? [{ title: `Registros por ${uf.col.label}`, chartType: "map_brasil", categoryColumn: uf.col.key, layout: { w: 2, h: 480 } } as Sugestao] : []),
    ...(lat && lng ? [{ title: "Mapa de ocorrências", chartType: "map_points", categoryColumn: lat.col.key, valueColumn: lng.col.key, layout: { w: 2, h: 440 } } as Sugestao] : []),
    ...(mun ? [{ title: `Ranking por ${mun.col.label}`, chartType: "bar", categoryColumn: mun.col.key, itemLimit: 15, layout: { w: 1, h: 440 } } as Sugestao] : []),
  ];
  switch (id) {
    case "kpis": return [kpiTotal, ...kpiUnicos, ...kpiNums];
    case "monitoramento": return [kpiTotal, ...tempo("column"), ...cat("bar", 3)];
    case "financeiro": return [kpiTotal, ...kpiNums, ...nums.slice(0, 2).flatMap((n) => cats.slice(0, 1).map((c) => ({ title: `${n.col.label} por ${c.col.label}`, chartType: "column", aggregation: "sum", valueColumn: n.col.key, categoryColumn: c.col.key, layout: { w: 2, h: 320 } } as Sugestao)))];
    case "temporal": return [...tempo("line"), ...tempo("area"), ...tempo("column")];
    case "geografico": return [kpiTotal, ...geo, ...cat("bar", 1)];
    case "categorias": return [kpiTotal, ...cat("donut", 2), ...cat("bar", 4).slice(2)];
    case "comparacao": return [...cat("column", 2, 2), ...cat("radar", 1)];
    case "tendencias": return [...tempo("line"), ...tempo("stacked")];
    case "tabela": return [...cat("table", 1).map((s) => ({ ...s, itemLimit: 25, layout: { w: 1 as const, h: 480 } })), ...cat("bar", 2)] as Sugestao[];
    case "midia": return [kpiTotal, ...tempo("area"), ...cat("bar", 4), ...geo.slice(0, 1)];
    case "volume": return [kpiTotal, ...kpiUnicos.slice(0, 1), ...cat("table", 2), ...tempo("column")];
    default: return [kpiTotal, ...kpiUnicos.slice(0, 1), ...kpiNums.slice(0, 1), ...tempo("area"), ...cat("bar", 2), ...geo.slice(0, 1)];
  }
}
