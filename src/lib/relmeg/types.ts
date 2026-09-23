export type CellValue = string | number | boolean | null;
export type ColumnType = "text" | "number" | "date" | "boolean";
export type DataColumn = { key: string; label: string; type: ColumnType; position: number };
export type DataRecord = { id: string; data: Record<string, CellValue>; position: number };
export type Dataset = { id: string; name: string; columns: DataColumn[] };
export type DashboardWidget = {
  id: string;
  title: string;
  description: string;
  chartType: "bar" | "pie" | "line";
  categoryColumn: string;
  valueColumn: string | null;
  aggregation: "count" | "sum" | "average" | "min" | "max";
  itemLimit: number;
  position: number;
  isVisible: boolean;
  isFeatured: boolean;
};
export type Filters = { busca: string; campos: Record<string, string> };
export const EMPTY_FILTERS: Filters = { busca: "", campos: {} };

export function cellText(value: CellValue | undefined) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}

export function recordTitle(record: DataRecord, columns: DataColumn[]) {
  const preferred = columns.find((c) => /^(nome|name|titulo|title)$/i.test(c.label)) ?? columns[0];
  return preferred ? cellText(record.data[preferred.key]) || "Registro sem título" : "Registro sem título";
}

export function recordSummary(record: DataRecord, columns: DataColumn[]) {
  return columns.slice(1, 4).map((c) => cellText(record.data[c.key])).filter(Boolean).join(" • ");
}

export function briefing(record: DataRecord, columns: DataColumn[]) {
  return [recordTitle(record, columns), "", ...columns.map((c) => {
    const value = cellText(record.data[c.key]);
    return value ? `${c.label}: ${value}` : "";
  })].filter(Boolean).join("\n");
}

export function isUrl(value: string) {
  return /^https?:\/\/\S+$/i.test(value.trim());
}
