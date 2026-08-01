import * as XLSX from "xlsx";
import { CAMPOS, normalizeKey, type Parlamentar } from "./types";

export type ParseResult = {
  rows: Parlamentar[];
  headers: string[];
  reconhecidos: string[];
  faltantes: string[];
};

export async function parseFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const headers = json.length ? Object.keys(json[0]) : [];

  const map = new Map<string, string>();
  for (const header of headers) {
    const norm = normalizeKey(header);
    const campo = CAMPOS.find((c) => c.aliases.includes(norm) || normalizeKey(c.label) === norm);
    if (campo && !map.has(campo.key)) map.set(campo.key, header);
  }

  const rows: Parlamentar[] = json
    .map((row, index) => {
      const get = (key: string) => {
        const header = map.get(key);
        return header ? String(row[header] ?? "").trim() : "";
      };
      const item: Parlamentar = {
        id: `${index}-${get("nome") || "sem-nome"}`,
        nome: get("nome"),
        partido: get("partido"),
        uf: get("uf").toUpperCase(),
        cargo: get("cargo"),
        termometro: get("termometro"),
        interesses: get("interesses"),
        setor1: get("setor1"),
        setor2: get("setor2"),
        setor3: get("setor3"),
        descricao: get("descricao"),
        proposicao1: get("proposicao1"),
        proposicao2: get("proposicao2"),
        proposicao3: get("proposicao3"),
        anotacoes: get("anotacoes"),
      };
      return item;
    })
    .filter((p) => p.nome !== "");

  const reconhecidos = CAMPOS.filter((c) => map.has(c.key)).map((c) => c.label);
  const faltantes = CAMPOS.filter((c) => !map.has(c.key)).map((c) => c.label);

  return { rows, headers, reconhecidos, faltantes };
}

export function baixarModelo() {
  const ws = XLSX.utils.aoa_to_sheet([CAMPOS.map((c) => c.label)]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Parlamentares");
  XLSX.writeFile(wb, "modelo-relmeg.xlsx");
}