import { useSyncExternalStore } from "react";
import { EMPTY_FILTERS, type DashboardWidget, type DataRecord, type Dataset, type Filters, type CellValue } from "./types";
import { TEXTOS_PADRAO, type Textos } from "./textos";
import { mesclarPrefs, PREFS_PADRAO, type CardPref, type Prefs } from "./prefs";
import { supabase } from "@/integrations/supabase/client";
import { usuarioAtual, encerrarSessao } from "./auth";
import { clearDataset, createRecord, createWidget, deleteRecord, deleteWidget, loadWorkspace, renameDataset, replaceDataset, updateRecord, updateWidget, type Workspace } from "./cloud";

const TEXTOS_KEY = "relmeg:textos";
const PREFS_KEY = "relmeg:prefs";
export type Sessao = { login: string; nome: string } | null;
export const TODAS = "todas";
const VISAO_KEY = "relmeg:visao";
type State = { bases: Workspace["bases"]; visao: string; dataset: Dataset | null; data: DataRecord[]; widgets: DashboardWidget[]; filters: Filters; textos: Textos; prefs: Prefs; sessao: Sessao; auth: boolean; loaded: boolean; carregandoBase: boolean; sincronizando: boolean };
let state: State = { bases: [], visao: TODAS, dataset: null, data: [], widgets: [], filters: EMPTY_FILTERS, textos: TEXTOS_PADRAO, prefs: PREFS_PADRAO, sessao: null, auth: false, loaded: false, carregandoBase: false, sincronizando: false };
const serverState = { ...state };
const listeners = new Set<() => void>();
function emit() { state = { ...state }; listeners.forEach((l) => l()); }
function hydrate() { if (state.loaded || typeof window === "undefined") return; try { const t = localStorage.getItem(TEXTOS_KEY); if (t) state.textos = { ...TEXTOS_PADRAO, ...JSON.parse(t) }; const p = localStorage.getItem(PREFS_KEY); state.prefs = mesclarPrefs(p ? JSON.parse(p) : null); state.visao = localStorage.getItem(VISAO_KEY) ?? TODAS; } catch { /* defaults */ } state.loaded = true; }
function subscribe(listener: () => void) { hydrate(); listeners.add(listener); return () => listeners.delete(listener); }
export function useRelmeg() { return useSyncExternalStore(subscribe, () => state, () => serverState); }
let userId: string | null = null;
let channel: ReturnType<typeof supabase.channel> | null = null;
let ws: Workspace = { bases: [], records: [], widgets: [] };
const slug = (t: string) => "c_" + (t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "coluna");
const origemRegistro = new Map<string, { datasetId: string; keyMap: Record<string, string>; raw: Record<string, CellValue> }>();
function montarVisao() {
  origemRegistro.clear();
  if (state.visao !== TODAS && !ws.bases.some((b) => b.id === state.visao)) state.visao = ws.bases.length === 1 ? ws.bases[0]!.id : TODAS;
  state.bases = ws.bases;
  if (!ws.bases.length) { state.dataset = null; state.data = []; state.widgets = []; return; }
  if (state.visao !== TODAS) {
    const b = ws.bases.find((x) => x.id === state.visao)!;
    state.dataset = { id: b.id, name: b.name, columns: b.columns };
    state.data = ws.records.filter((r) => r.datasetId === b.id);
    state.widgets = ws.widgets.filter((w) => w.datasetId === b.id && !w.combined).sort((x, y) => x.position - y.position);
    for (const r of state.data) origemRegistro.set(r.id, { datasetId: b.id, keyMap: {}, raw: r.data });
    return;
  }
  const cols: Dataset["columns"] = [{ key: "__planilha", label: "Planilha", type: "text", position: 0 }];
  const maps = new Map<string, Record<string, string>>();
  for (const b of ws.bases) {
    const m: Record<string, string> = {};
    for (const c of b.columns) {
      const k = slug(c.label); m[k] = c.key;
      const ex = cols.find((x) => x.key === k);
      if (!ex) cols.push({ key: k, label: c.label, type: c.type, position: cols.length });
      else if (ex.type !== c.type) ex.type = "text";
    }
    maps.set(b.id, m);
  }
  const nomes = new Map(ws.bases.map((b) => [b.id, b.name]));
  state.dataset = { id: TODAS, name: ws.bases.length > 1 ? `Todas as planilhas (${ws.bases.length})` : ws.bases[0]!.name, columns: cols };
  state.data = ws.records.map((r) => {
    const m = maps.get(r.datasetId) ?? {};
    const data: Record<string, CellValue> = { __planilha: nomes.get(r.datasetId) ?? "" };
    for (const [k, orig] of Object.entries(m)) data[k] = r.data[orig] ?? null;
    origemRegistro.set(r.id, { datasetId: r.datasetId, keyMap: m, raw: r.data });
    return { id: r.id, data, position: r.position };
  });
  state.widgets = ws.widgets.filter((w) => w.combined || ws.bases.length === 1).sort((x, y) => x.position - y.position);
}
export function setVisao(v: string) { state.visao = v; localStorage.setItem(VISAO_KEY, v); state.filters = EMPTY_FILTERS; montarVisao(); emit(); }
export async function recarregarBase() { if (!userId) return; state.carregandoBase = true; emit(); try { ws = await loadWorkspace(userId); } catch { ws = { bases: [], records: [], widgets: [] }; } finally { montarVisao(); state.carregandoBase = false; emit(); } }
function listen() { if (channel || !userId) return; channel = supabase.channel("universal-sync").on("postgres_changes", { event: "*", schema: "public", table: "datasets", filter: `user_id=eq.${userId}` }, () => void recarregarBase()).on("postgres_changes", { event: "*", schema: "public", table: "data_records", filter: `user_id=eq.${userId}` }, () => void recarregarBase()).on("postgres_changes", { event: "*", schema: "public", table: "dashboard_widgets", filter: `user_id=eq.${userId}` }, () => void recarregarBase()).subscribe(); }
function unlisten() { if (channel) void supabase.removeChannel(channel); channel = null; }
export async function iniciarSessao() { hydrate(); const { data } = await supabase.auth.getSession(); const user = data.session?.user; if (!user) { state.auth = false; state.sessao = null; emit(); return; } userId = user.id; state.sessao = await usuarioAtual(); state.auth = true; emit(); await recarregarBase(); listen(); }
export async function adicionarBase(rows: Record<string, CellValue>[], columns: Dataset["columns"], name: string) { if (!userId) return; state.sincronizando = true; emit(); try { const id = await replaceDataset(userId, name, columns, rows); state.filters = EMPTY_FILTERS; await recarregarBase(); if (state.bases.length > 1 && state.visao !== TODAS) setVisao(id); } finally { state.sincronizando = false; emit(); } }
export async function excluirBase(id: string) { await clearDataset(id); await recarregarBase(); }
export async function renomearBase(id: string, name: string) { await renameDataset(id, name); ws.bases = ws.bases.map((b) => b.id === id ? { ...b, name } : b); montarVisao(); emit(); }
export async function criarRegistro() { if (!userId || !state.dataset) return null; const base = state.visao === TODAS ? ws.bases[ws.bases.length - 1] : ws.bases.find((b) => b.id === state.visao); if (!base) return null; const blank = Object.fromEntries(base.columns.map((c) => [c.key, null])); const record = await createRecord(userId, base.id, blank, state.data.length); ws.records = [...ws.records, { ...record, datasetId: base.id }]; montarVisao(); emit(); return record; }
const timers = new Map<string, ReturnType<typeof setTimeout>>();
export function editarRegistro(id: string, key: string, value: CellValue) { const record = state.data.find((r) => r.id === id); const origem = origemRegistro.get(id); if (!record || !origem || key === "__planilha") return; const origKey = state.visao === TODAS ? origem.keyMap[key] : key; if (!origKey) return; const next = { ...origem.raw, [origKey]: value }; origem.raw = next; ws.records = ws.records.map((r) => r.id === id ? { ...r, data: next } : r); state.data = state.data.map((r) => r.id === id ? { ...r, data: { ...r.data, [key]: value } } : r); state.sincronizando = true; emit(); const old = timers.get(id); if (old) clearTimeout(old); timers.set(id, setTimeout(async () => { try { await updateRecord(id, next); } finally { timers.delete(id); if (!timers.size) { state.sincronizando = false; emit(); } } }, 600)); }
export async function excluirRegistro(id: string) { await deleteRecord(id); ws.records = ws.records.filter((r) => r.id !== id); montarVisao(); emit(); }
export function setFilter(key: string, value: string) { state.filters = key === "busca" ? { ...state.filters, busca: value } : { ...state.filters, campos: { ...state.filters.campos, [key]: value } }; emit(); }
export function clearFilters() { state.filters = EMPTY_FILTERS; emit(); }
export async function adicionarWidget() { if (!userId || !state.dataset?.columns[0]) return; const combined = state.visao === TODAS && ws.bases.length > 1; const alvo = state.visao === TODAS ? ws.bases[0]?.id : state.dataset.id; if (!alvo) return; const col = state.dataset.columns.find((c) => c.key !== "__planilha") ?? state.dataset.columns[0]; await createWidget(userId, alvo, col.key, Math.max(-1, ...state.widgets.map((w) => w.position)) + 1, combined); await recarregarBase(); }
export async function moverWidget(id: string, destino: number) { const list = [...state.widgets]; const i = list.findIndex((w) => w.id === id); if (i < 0 || destino < 0 || destino >= list.length || i === destino) return; const [item] = list.splice(i, 1); list.splice(destino, 0, item!); const pos = new Map(list.map((w, idx) => [w.id, idx])); ws.widgets = ws.widgets.map((w) => pos.has(w.id) ? { ...w, position: pos.get(w.id)! } : w); montarVisao(); emit(); await Promise.all(list.map((w, idx) => updateWidget(w.id, { position: idx }))); }
export async function editarWidget(id: string, patch: Partial<DashboardWidget>) { ws.widgets = ws.widgets.map((w) => w.id === id ? { ...w, ...patch } : w); montarVisao(); emit(); await updateWidget(id, patch); }
export async function excluirWidget(id: string) { await deleteWidget(id); ws.widgets = ws.widgets.filter((w) => w.id !== id); montarVisao(); emit(); }
export function setTexto(key: keyof Textos, value: string) { state.textos = { ...state.textos, [key]: value }; localStorage.setItem(TEXTOS_KEY, JSON.stringify(state.textos)); emit(); }
export function resetTextos() { state.textos = TEXTOS_PADRAO; localStorage.removeItem(TEXTOS_KEY); emit(); }
export async function login(sessao: NonNullable<Sessao>) { const { data } = await supabase.auth.getSession(); userId = data.session?.user.id ?? null; state.sessao = sessao; state.auth = true; emit(); await recarregarBase(); listen(); }
export async function logout() { unlisten(); await encerrarSessao(); userId = null; ws = { bases: [], records: [], widgets: [] }; state = { ...state, bases: [], dataset: null, data: [], widgets: [], sessao: null, auth: false }; emit(); }
function persistPrefs() { localStorage.setItem(PREFS_KEY, JSON.stringify(state.prefs)); emit(); }
export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) { state.prefs = { ...state.prefs, [key]: value }; persistPrefs(); }
export function atualizarCard(grupo: "kpis" | "paineis", key: string, patch: Partial<CardPref>) { state.prefs = { ...state.prefs, [grupo]: state.prefs[grupo].map((c) => c.key === key ? { ...c, ...patch } : c) }; persistPrefs(); }
export function moverCard(grupo: "kpis" | "paineis", key: string, direcao: -1 | 1) { const list = [...state.prefs[grupo]]; const i = list.findIndex((c) => c.key === key); const j = i + direcao; if (i < 0 || j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j] as CardPref, list[i] as CardPref]; state.prefs = { ...state.prefs, [grupo]: list }; persistPrefs(); }
export function resetPrefs() { state.prefs = mesclarPrefs(null); localStorage.removeItem(PREFS_KEY); emit(); }
