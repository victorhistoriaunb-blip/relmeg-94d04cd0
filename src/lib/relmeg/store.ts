import { useSyncExternalStore } from "react";
import { EMPTY_FILTERS, type Filters, type Parlamentar } from "./types";

const DATA_KEY = "relmeg:parlamentares";
const AUTH_KEY = "relmeg:auth";

type State = {
  data: Parlamentar[];
  filters: Filters;
  auth: boolean;
  loaded: boolean;
};

let state: State = { data: [], filters: EMPTY_FILTERS, auth: false, loaded: false };
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

const serverState: State = { data: [], filters: EMPTY_FILTERS, auth: false, loaded: false };

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

export function setAuth(value: boolean) {
  state.auth = value;
  if (typeof window !== "undefined") window.localStorage.setItem(AUTH_KEY, value ? "1" : "0");
  emit();
}