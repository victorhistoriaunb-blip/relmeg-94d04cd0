import * as XLSX from "xlsx";
import type { CellValue, ColumnType, DataColumn } from "./types";

export type ParsedRow = Record<string, CellValue>;
export type ParseResult = { rows: ParsedRow[]; headers: string[]; columns: DataColumn[]; sheetName: string };

function keyFor(label: string, index: number) {
  const clean = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `${clean || "coluna"}_${index}`;
}

function inferType(values: unknown[]): ColumnType {
  const filled = values.filter((v) => v !== "" && v !== null && v !== undefined);
  if (!filled.length) return "text";
  if (filled.every((v) => typeof v === "boolean" || /^(sim|não|nao|true|false)$/i.test(String(v)))) return "boolean";
  if (filled.every((v) => typeof v === "number" || /^-?\d+(?:[.,]\d+)?$/.test(String(v).trim()))) return "number";
  if (filled.every((v) => v instanceof Date || /^\d{1,4}[/-]\d{1,2}[/-]\d{1,4}$/.test(String(v).trim()))) return "date";
  return "text";
}

function convert(value: unknown, type: ColumnType): CellValue {
  if (value === "" || value === null || value === undefined) return null;
  if (type === "number") {
    const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
    return Number.isFinite(n) ? n : String(value);
  }
  if (type === "boolean") return typeof value === "boolean" ? value : /^(sim|true)$/i.test(String(value));
  return String(value).trim();
}

export async function parseFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", raw: true, cellDates: true });
  const sheetName = workbook.SheetNames[0] ?? "Dados";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { rows: [], headers: [], columns: [], sheetName };
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true });
  const rawHeaders = matrix[0] ?? [];
  const headers = rawHeaders.map((h, i) => String(h || `Coluna ${i + 1}`).trim());
  const body = matrix.slice(1).filter((row) => row.some((v) => v !== "" && v !== null && v !== undefined));
  const columns = headers.map((label, i) => ({ key: keyFor(label, i), label, type: inferType(body.map((r) => r[i])), position: i }));
  const rows = body.map((row) => Object.fromEntries(columns.map((c, i) => [c.key, convert(row[i], c.type)])));
  return { rows, headers, columns, sheetName };
}
