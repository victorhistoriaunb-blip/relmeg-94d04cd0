import { useSyncExternalStore } from "react";
import { EMPTY_FILTERS, type DashboardWidget, type DataRecord, type Dataset, type Filters, type CellValue } from "./types";
import { TEXTOS_PADRAO, type Textos } from "./textos";
import { mesclarPrefs, PREFS_PADRAO, type CardPref, type Prefs } from "./prefs";
import { supabase } from "@/integrations/supabase/client";
import { usuarioAtual, encerrarSessao } from "./auth";
import { clearDataset, createRecord, createWidget, deleteRecord, deleteWidget, loadWorkspace, replaceDataset, updateRecord, updateWidget } from "./cloud";

const TEXTOS_KEY = "relmeg:textos";
const PREFS_KEY = "relmeg:prefs";
export type Sessao = { login: string; nome: string } | null;
type State = { dataset: Dataset | null; data: DataRecord[]; widgets: DashboardWidget[]; filters: Filters; textos: Textos; prefs: Prefs; sessao: Sessao; auth: boolean; loaded: boolean; carregandoBase: boolean; sincronizando: boolean };
let state: State = { dataset: null, data: [], widgets: [], filters: EMPTY_FILTERS, textos: TEXTOS_PADRAO, prefs: PREFS_PADRAO, sessao: null, auth: false, loaded: false, carregandoBase: false, sincronizando: false };
const serverState = { ...state };
const listeners = new Set<() => void>();
function emit() { state = { ...state }; listeners.forEach((l) => l()); }
function hydrate() { if (state.loaded || typeof window === "undefined") return; try { const t = localStorage.getItem(TEXTOS_KEY); if (t) state.textos = { ...TEXTOS_PADRAO, ...JSON.parse(t) }; const p = localStorage.getItem(PREFS_KEY); state.prefs = mesclarPrefs(p ? JSON.parse(p) : null); } catch { /* defaults */ } state.loaded = true; }
function subscribe(listener: () => void) { hydrate(); listeners.add(listener); return () => listeners.delete(listener); }
export function useRelmeg() { return useSyncExternalStore(subscribe, () => state, () => serverState); }
let userId: string | null = null;
let channel: ReturnType<typeof supabase.channel> | null = null;
export async function recarregarBase() { if (!userId) return; state.carregandoBase = true; emit(); try { const loaded = await loadWorkspace(userId); state.dataset = loaded.dataset; state.data = loaded.records; state.widgets = loaded.widgets; } catch { state.dataset = null; state.data = []; state.widgets = []; } finally { state.carregandoBase = false; emit(); } }
function listen() { if (channel || !userId) return; channel = supabase.channel("universal-sync").on("postgres_changes", { event: "*", schema: "public", table: "datasets", filter: `user_id=eq.${userId}` }, () => void recarregarBase()).on("postgres_changes", { event: "*", schema: "public", table: "data_records", filter: `user_id=eq.${userId}` }, () => void recarregarBase()).on("postgres_changes", { event: "*", schema: "public", table: "dashboard_widgets", filter: `user_id=eq.${userId}` }, () => void recarregarBase()).subscribe(); }
function unlisten() { if (channel) void supabase.removeChannel(channel); channel = null; }
export async function iniciarSessao() { hydrate(); const { data } = await supabase.auth.getSession(); const user = data.session?.user; if (!user) { state.auth = false; state.sessao = null; emit(); return; } userId = user.id; state.sessao = await usuarioAtual(); state.auth = true; emit(); await recarregarBase(); listen(); }
export async function substituirBase(rows: Record<string, CellValue>[], columns: Dataset["columns"], name: string) { if (!userId) return; state.sincronizando = true; emit(); try { await replaceDataset(userId, name, columns, rows); state.filters = EMPTY_FILTERS; await recarregarBase(); } finally { state.sincronizando = false; emit(); } }
export async function limparBase() { if (!state.dataset) return; await clearDataset(state.dataset.id); state.dataset = null; state.data = []; state.widgets = []; emit(); }
export async function criarRegistro() { if (!userId || !state.dataset) return null; const blank = Object.fromEntries(state.dataset.columns.map((c) => [c.key, null])); const record = await createRecord(userId, state.dataset.id, blank, state.data.length); state.data = [...state.data, record]; emit(); return record; }
const timers = new Map<string, ReturnType<typeof setTimeout>>();
export function editarRegistro(id: string, key: string, value: CellValue) { const record = state.data.find((r) => r.id === id); if (!record) return; const next = { ...record.data, [key]: value }; state.data = state.data.map((r) => r.id === id ? { ...r, data: next } : r); state.sincronizando = true; emit(); const old = timers.get(id); if (old) clearTimeout(old); timers.set(id, setTimeout(async () => { try { await updateRecord(id, next); } finally { timers.delete(id); if (!timers.size) { state.sincronizando = false; emit(); } } }, 600)); }
export async function excluirRegistro(id: string) { await deleteRecord(id); state.data = state.data.filter((r) => r.id !== id); emit(); }
export function setFilter(key: string, value: string) { state.filters = key === "busca" ? { ...state.filters, busca: value } : { ...state.filters, campos: { ...state.filters.campos, [key]: value } }; emit(); }
export function clearFilters() { state.filters = EMPTY_FILTERS; emit(); }
export async function adicionarWidget() { if (!userId || !state.dataset?.columns[0]) return; await createWidget(userId, state.dataset.id, state.dataset.columns[0].key, state.widgets.length); await recarregarBase(); }
export async function editarWidget(id: string, patch: Partial<DashboardWidget>) { state.widgets = state.widgets.map((w) => w.id === id ? { ...w, ...patch } : w); emit(); await updateWidget(id, patch); }
export async function excluirWidget(id: string) { await deleteWidget(id); state.widgets = state.widgets.filter((w) => w.id !== id); emit(); }
export function setTexto(key: keyof Textos, value: string) { state.textos = { ...state.textos, [key]: value }; localStorage.setItem(TEXTOS_KEY, JSON.stringify(state.textos)); emit(); }
export function resetTextos() { state.textos = TEXTOS_PADRAO; localStorage.removeItem(TEXTOS_KEY); emit(); }
export async function login(sessao: NonNullable<Sessao>) { const { data } = await supabase.auth.getSession(); userId = data.session?.user.id ?? null; state.sessao = sessao; state.auth = true; emit(); await recarregarBase(); listen(); }
export async function logout() { unlisten(); await encerrarSessao(); userId = null; state = { ...state, dataset: null, data: [], widgets: [], sessao: null, auth: false }; emit(); }
function persistPrefs() { localStorage.setItem(PREFS_KEY, JSON.stringify(state.prefs)); emit(); }
export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) { state.prefs = { ...state.prefs, [key]: value }; persistPrefs(); }
export function atualizarCard(grupo: "kpis" | "paineis", key: string, patch: Partial<CardPref>) { state.prefs = { ...state.prefs, [grupo]: state.prefs[grupo].map((c) => c.key === key ? { ...c, ...patch } : c) }; persistPrefs(); }
export function moverCard(grupo: "kpis" | "paineis", key: string, direcao: -1 | 1) { const list = [...state.prefs[grupo]]; const i = list.findIndex((c) => c.key === key); const j = i + direcao; if (i < 0 || j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j] as CardPref, list[i] as CardPref]; state.prefs = { ...state.prefs, [grupo]: list }; persistPrefs(); }
export function resetPrefs() { state.prefs = mesclarPrefs(null); localStorage.removeItem(PREFS_KEY); emit(); }
