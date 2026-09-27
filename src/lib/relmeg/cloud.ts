import { supabase } from "@/integrations/supabase/client";
import type { DashboardWidget, DataColumn, DataRecord, Dataset, CellValue } from "./types";

type Json = import("@/integrations/supabase/types").Json;

const asColumns = (value: Json): DataColumn[] => Array.isArray(value) ? value.filter((v): v is Record<string, Json | undefined> => Boolean(v && typeof v === "object" && !Array.isArray(v))).map((v, i) => ({ key: String(v["key"] ?? `coluna_${i}`), label: String(v["label"] ?? `Coluna ${i + 1}`), type: (["text", "number", "date", "boolean"].includes(String(v["type"])) ? String(v["type"]) : "text") as DataColumn["type"], position: Number(v["position"] ?? i) })) : [];
const asData = (value: Json): Record<string, CellValue> => value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null ? v : String(v)])) : {};

export type Workspace = { bases: (Dataset & { isActive: boolean; createdAt: string })[]; records: (DataRecord & { datasetId: string })[]; widgets: (DashboardWidget & { datasetId: string; combined: boolean })[] };
async function todos<T>(q: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) { const out: T[] = []; for (let i = 0; ; i += 1000) { const { data, error } = await q(i, i + 999); if (error) throw error; out.push(...(data ?? [])); if (!data || data.length < 1000) return out; } }
export async function loadWorkspace(userId: string): Promise<Workspace> {
  const { data: bases, error } = await supabase.from("datasets").select("*").eq("user_id", userId).order("created_at");
  if (error) throw error;
  const [records, widgets] = await Promise.all([
    todos((f, t) => supabase.from("data_records").select("*").eq("user_id", userId).order("position").range(f, t)),
    todos((f, t) => supabase.from("dashboard_widgets").select("*").eq("user_id", userId).order("position").range(f, t)),
  ]);
  return {
    bases: (bases ?? []).map((row) => ({ id: row.id, name: row.name, columns: asColumns(row.columns), isActive: row.is_active, createdAt: row.created_at })),
    records: records.map((r) => ({ id: r.id, datasetId: r.dataset_id, data: asData(r.data), position: r.position })),
    widgets: widgets.map((w) => ({ id: w.id, datasetId: w.dataset_id, combined: w.combined, title: w.title, description: w.description, chartType: w.chart_type as DashboardWidget["chartType"], categoryColumn: w.category_column, valueColumn: w.value_column, aggregation: w.aggregation as DashboardWidget["aggregation"], itemLimit: w.item_limit, position: w.position, isVisible: w.is_visible, isFeatured: w.is_featured })),
  };
}
export async function renameDataset(id: string, name: string) { const { error } = await supabase.from("datasets").update({ name }).eq("id", id); if (error) throw error; }

export async function replaceDataset(userId: string, name: string, columns: DataColumn[], rows: Record<string, CellValue>[]) {
  const { data: dataset, error } = await supabase.from("datasets").insert({ user_id: userId, name, columns: columns as unknown as Json, is_active: true }).select("*").single();
  if (error) throw error;
  if (rows.length) {
    const { error: insertError } = await supabase.from("data_records").insert(rows.map((data, position) => ({ user_id: userId, dataset_id: dataset.id, data: data as unknown as Json, position })));
    if (insertError) throw insertError;
  }
  return dataset.id;
}

export async function createRecord(userId: string, datasetId: string, data: Record<string, CellValue>, position: number) {
  const { data: row, error } = await supabase.from("data_records").insert({ user_id: userId, dataset_id: datasetId, data: data as unknown as Json, position }).select("*").single();
  if (error) throw error;
  return { id: row.id, data: asData(row.data), position: row.position };
}
export async function updateRecord(id: string, data: Record<string, CellValue>) { const { error } = await supabase.from("data_records").update({ data: data as unknown as Json }).eq("id", id); if (error) throw error; }
export async function deleteRecord(id: string) { const { error } = await supabase.from("data_records").delete().eq("id", id); if (error) throw error; }
export async function clearDataset(id: string) { const { error } = await supabase.from("datasets").delete().eq("id", id); if (error) throw error; }

export async function createWidget(userId: string, datasetId: string, categoryColumn: string, position: number, combined = false) {
  const { data, error } = await supabase.from("dashboard_widgets").insert({ user_id: userId, dataset_id: datasetId, title: "Novo dashboard", category_column: categoryColumn, position, combined }).select("*").single();
  if (error) throw error;
  return data.id;
}
export async function updateWidget(id: string, patch: Partial<DashboardWidget>) {
  const db: import("@/integrations/supabase/types").TablesUpdate<"dashboard_widgets"> = {};
  if (patch.title !== undefined) db.title = patch.title;
  if (patch.description !== undefined) db.description = patch.description;
  if (patch.chartType !== undefined) db.chart_type = patch.chartType;
  if (patch.categoryColumn !== undefined) db.category_column = patch.categoryColumn;
  if (patch.valueColumn !== undefined) db.value_column = patch.valueColumn;
  if (patch.aggregation !== undefined) db.aggregation = patch.aggregation;
  if (patch.itemLimit !== undefined) db.item_limit = patch.itemLimit;
  if (patch.position !== undefined) db.position = patch.position;
  if (patch.isVisible !== undefined) db.is_visible = patch.isVisible;
  if (patch.isFeatured !== undefined) db.is_featured = patch.isFeatured;
  const { error } = await supabase.from("dashboard_widgets").update(db).eq("id", id); if (error) throw error;
}
export async function deleteWidget(id: string) { const { error } = await supabase.from("dashboard_widgets").delete().eq("id", id); if (error) throw error; }
