import { supabase } from "@/integrations/supabase/client";
import type { DashboardWidget, DataColumn, DataRecord, Dataset, CellValue } from "./types";

type Json = import("@/integrations/supabase/types").Json;

const asColumns = (value: Json): DataColumn[] => Array.isArray(value) ? value.filter((v): v is Record<string, Json | undefined> => Boolean(v && typeof v === "object" && !Array.isArray(v))).map((v, i) => ({ key: String(v.key ?? `coluna_${i}`), label: String(v.label ?? `Coluna ${i + 1}`), type: (["text", "number", "date", "boolean"].includes(String(v.type)) ? String(v.type) : "text") as DataColumn["type"], position: Number(v.position ?? i) })) : [];
const asData = (value: Json): Record<string, CellValue> => value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null ? v : String(v)])) : {};

export async function loadWorkspace(userId: string): Promise<{ dataset: Dataset | null; records: DataRecord[]; widgets: DashboardWidget[] }> {
  const { data: bases, error } = await supabase.from("datasets").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  const row = bases?.find((b) => b.is_active) ?? bases?.[0];
  if (!row) return { dataset: null, records: [], widgets: [] };
  const [{ data: records, error: re }, { data: widgets, error: we }] = await Promise.all([
    supabase.from("data_records").select("*").eq("dataset_id", row.id).order("position"),
    supabase.from("dashboard_widgets").select("*").eq("dataset_id", row.id).order("position"),
  ]);
  if (re) throw re;
  if (we) throw we;
  return {
    dataset: { id: row.id, name: row.name, columns: asColumns(row.columns) },
    records: (records ?? []).map((r) => ({ id: r.id, data: asData(r.data), position: r.position })),
    widgets: (widgets ?? []).map((w) => ({ id: w.id, title: w.title, description: w.description, chartType: w.chart_type as DashboardWidget["chartType"], categoryColumn: w.category_column, valueColumn: w.value_column, aggregation: w.aggregation as DashboardWidget["aggregation"], itemLimit: w.item_limit, position: w.position, isVisible: w.is_visible, isFeatured: w.is_featured })),
  };
}

export async function replaceDataset(userId: string, name: string, columns: DataColumn[], rows: Record<string, CellValue>[]) {
  await supabase.from("datasets").update({ is_active: false }).eq("user_id", userId);
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

export async function createWidget(userId: string, datasetId: string, categoryColumn: string, position: number) {
  const { data, error } = await supabase.from("dashboard_widgets").insert({ user_id: userId, dataset_id: datasetId, title: "Novo dashboard", category_column: categoryColumn, position }).select("*").single();
  if (error) throw error;
  return data.id;
}
export async function updateWidget(id: string, patch: Partial<DashboardWidget>) {
  const db: Record<string, unknown> = {};
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
