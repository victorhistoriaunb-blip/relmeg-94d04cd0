import { useSyncExternalStore } from "react";
import { EMPTY_FILTERS, type Filters, type Parlamentar } from "./types";
import { TEXTOS_PADRAO, type Textos } from "./textos";
import { mesclarPrefs, PREFS_PADRAO, type CardPref, type Prefs } from "./prefs";

const DATA_KEY = "relmeg:parlamentares";
const AUTH_KEY = "relmeg:auth";
const TEXTOS_KEY = "relmeg:textos";
const PREFS_KEY = "relmeg:prefs";
const SESSAO_KEY = "relmeg:sessao";

export type Sessao = { login: string; nome: string } | null;

type State = {
  data: Parlamentar[];
  filters: Filters;
  textos: Textos;
  prefs: Prefs;
  sessao: Sessao;
  auth: boolean;
  loaded: boolean;
};

let state: State = {
  data: [],
  filters: EMPTY_FILTERS,
  textos: TEXTOS_PADRAO,
  prefs: PREFS_PADRAO,
  sessao: null,
  auth: false,
  loaded: false,
};
const listeners = new Set<() => void>();

function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}

function hydrate() {
  if (state.loaded || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    state.data = raw ? (JSON.parse(raw) as Parlamentar[]) : [];
    const textos = window.localStorage.getItem(TEXTOS_KEY);
    if (textos) state.textos = { ...TEXTOS_PADRAO, ...(JSON.parse(textos) as Partial<Textos>) };
    const prefs = window.localStorage.getItem(PREFS_KEY);
    state.prefs = mesclarPrefs(prefs ? (JSON.parse(prefs) as Partial<Prefs>) : null);
    const sessao = window.localStorage.getItem(SESSAO_KEY);
    state.sessao = sessao ? (JSON.parse(sessao) as Sessao) : null;
    state.auth = window.localStorage.getItem(AUTH_KEY) === "1";
  } catch {
    state.data = [];
  }
  state.loaded = true;
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverState: State = {
  data: [],
  filters: EMPTY_FILTERS,
  textos: TEXTOS_PADRAO,
  prefs: PREFS_PADRAO,
  sessao: null,
  auth: false,
  loaded: false,
};

export function useRelmeg() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}

export function setData(data: Parlamentar[]) {
  state.data = data;
  if (typeof window !== "undefined") window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
  emit();
}

export function clearData() {
  setData([]);
}

export function setFilter(key: keyof Filters, value: string) {
  state.filters = { ...state.filters, [key]: value };
  emit();
}

export function clearFilters() {
  state.filters = EMPTY_FILTERS;
  emit();
}

export function setTexto(key: keyof Textos, value: string) {
  state.textos = { ...state.textos, [key]: value };
  if (typeof window !== "undefined") window.localStorage.setItem(TEXTOS_KEY, JSON.stringify(state.textos));
  emit();
}

export function resetTextos() {
  state.textos = TEXTOS_PADRAO;
  if (typeof window !== "undefined") window.localStorage.removeItem(TEXTOS_KEY);
  emit();
}

export function setAuth(value: boolean) {
  state.auth = value;
  if (typeof window !== "undefined") window.localStorage.setItem(AUTH_KEY, value ? "1" : "0");
  emit();
}

export function login(sessao: NonNullable<Sessao>) {
  state.sessao = sessao;
  state.auth = true;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSAO_KEY, JSON.stringify(sessao));
    window.localStorage.setItem(AUTH_KEY, "1");
  }
  emit();
}

export function logout() {
  state.sessao = null;
  state.auth = false;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSAO_KEY);
    window.localStorage.setItem(AUTH_KEY, "0");
  }
  emit();
}

function persistirPrefs() {
  if (typeof window !== "undefined") window.localStorage.setItem(PREFS_KEY, JSON.stringify(state.prefs));
  emit();
}

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  state.prefs = { ...state.prefs, [key]: value };
  persistirPrefs();
}

export function atualizarCard(grupo: "kpis" | "paineis", key: string, patch: Partial<CardPref>) {
  state.prefs = {
    ...state.prefs,
    [grupo]: state.prefs[grupo].map((c) => (c.key === key ? { ...c, ...patch } : c)),
  };
  persistirPrefs();
}

export function moverCard(grupo: "kpis" | "paineis", key: string, direcao: -1 | 1) {
  const lista = [...state.prefs[grupo]];
  const i = lista.findIndex((c) => c.key === key);
  const j = i + direcao;
  if (i === -1 || j < 0 || j >= lista.length) return;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  state.prefs = { ...state.prefs, [grupo]: lista };
  persistirPrefs();
}

export function resetPrefs() {
  state.prefs = mesclarPrefs(null);
  if (typeof window !== "undefined") window.localStorage.removeItem(PREFS_KEY);
  emit();
}
