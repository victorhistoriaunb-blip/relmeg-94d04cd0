import { useState } from "react";
import { FileDown, Loader2, Presentation, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { DashboardWidget, DataColumn, DataRecord, Filters } from "@/lib/relmeg/types";
import { FICHA_PADRAO, gerarPdf, gerarPptx, type FichaConfig } from "@/lib/relmeg/report";

function Opcao({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      {label}
    </label>
  );
}

export function FichaDialog({ data, columns, widgets, filters }: { data: DataRecord[]; columns: DataColumn[]; widgets: DashboardWidget[]; filters: Filters }) {
  const [config, setConfig] = useState<FichaConfig>(FICHA_PADRAO);
  const [busy, setBusy] = useState<"pdf" | "pptx" | null>(null);
  const set = <K extends keyof FichaConfig>(k: K, v: FichaConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));
  const exportar = async (tipo: "pdf" | "pptx") => {
    setBusy(tipo);
    try {
      const args = { config, data, columns, widgets, filters };
      if (tipo === "pdf") await gerarPdf(args); else await gerarPptx(args);
      toast.success("Ficha gerada");
    } catch { toast.error("Não foi possível gerar a ficha"); } finally { setBusy(null); }
  };
  return (
    <Dialog>
      <DialogTrigger asChild><Button disabled={!data.length}><Settings2 />Gerar ficha</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerar ficha de estudo</DialogTitle>
          <DialogDescription>{data.length} registros filtrados serão usados.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="f-t">Título</Label><Input id="f-t" value={config.titulo} onChange={(e) => set("titulo", e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="f-s">Subtítulo</Label><Input id="f-s" value={config.subtitulo} onChange={(e) => set("subtitulo", e.target.value)} /></div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Opcao id="f-fi" label="Filtros" checked={config.incluirFiltros} onChange={(v) => set("incluirFiltros", v)} />
            <Opcao id="f-in" label="Indicadores" checked={config.incluirIndicadores} onChange={(v) => set("incluirIndicadores", v)} />
            <Opcao id="f-gr" label="Gráficos" checked={config.incluirGraficos} onChange={(v) => set("incluirGraficos", v)} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Campos dos registros (nenhum marcado = todos)</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {columns.map((c) => (
                <Opcao key={c.key} id={`f-c-${c.key}`} label={c.label} checked={config.campos.includes(c.key)} onChange={(v) => set("campos", v ? [...config.campos, c.key] : config.campos.filter((k) => k !== c.key))} />
              ))}
            </div>
          </div>
          <div className="max-w-40 space-y-1.5"><Label htmlFor="f-l">Limite de registros</Label><Input id="f-l" type="number" min={1} value={config.limite} onChange={(e) => set("limite", Math.max(1, Number(e.target.value) || 1))} /></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={!!busy} onClick={() => exportar("pptx")}>{busy === "pptx" ? <Loader2 className="animate-spin" /> : <Presentation />}PowerPoint</Button>
          <Button disabled={!!busy} onClick={() => exportar("pdf")}>{busy === "pdf" ? <Loader2 className="animate-spin" /> : <FileDown />}PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
