import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type ReactNode } from "react";
import { Copy, Loader2, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/relmeg/EmptyState";
import { FilterBar, aplicarFiltros } from "@/components/relmeg/FilterBar";
import { useRelmeg } from "@/lib/relmeg/store";
import { supabase } from "@/integrations/supabase/client";
import { agregar } from "@/lib/relmeg/report";
import { cellText, type DataColumn, type DataRecord } from "@/lib/relmeg/types";

export const Route = createFileRoute("/analise")({
  head: () => ({
    meta: [
      { title: "Análise com IA — RelMeg" },
      { name: "description", content: "Gere análises com conclusões e referências às planilhas de origem." },
      { property: "og:title", content: "Análise com IA — RelMeg" },
      { property: "og:description", content: "Análises automáticas com IA a partir das suas planilhas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analise,
});

const MAX_LINHAS = 400;
function montarContexto(data: DataRecord[], columns: DataColumn[], nomeBase: string) {
  const temPlanilha = columns.some((c) => c.key === "__planilha");
  const stats = columns.map((c) => {
    const valores = data.map((r) => cellText(r.data[c.key])).filter(Boolean);
    const distintos = new Set(valores).size;
    const top = agregar(data, { categoryColumn: c.key, valueColumn: null, aggregation: "count", itemLimit: 8 }).map((t) => `${t.name} (${t.total})`).join("; ");
    const nums = c.type === "number" ? data.map((r) => r.data[c.key]).filter((v): v is number => typeof v === "number") : [];
    const num = nums.length ? ` | soma ${nums.reduce((a, b) => a + b, 0)} | média ${(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)} | mín ${Math.min(...nums)} | máx ${Math.max(...nums)}` : "";
    return `- ${c.label} [${c.type}]: ${valores.length} preenchidos, ${distintos} distintos | mais frequentes: ${top}${num}`;
  });
  const cols = columns.map((c) => c.label);
  const linhas = data.slice(0, MAX_LINHAS).map((r, i) => `#${i + 1}${temPlanilha ? "" : ` | Planilha: ${nomeBase}`} | ` + columns.map((c) => `${c.label}: ${cellText(r.data[c.key]).slice(0, 180)}`).filter((s) => !s.endsWith(": ")).join(" | "));
  return [`Base: ${nomeBase}. Total de registros no recorte: ${data.length}${data.length > MAX_LINHAS ? ` (amostra das primeiras ${MAX_LINHAS} linhas abaixo; estatísticas cobrem todos)` : ""}.`, `Colunas: ${cols.join(", ")}`, "", "ESTATÍSTICAS POR COLUNA:", ...stats, "", "REGISTROS:", ...linhas].join("\n").slice(0, 380_000);
}

function inline(t: string): ReactNode[] {
  return t.split(/(\*\*[^*]+\*\*|\[Planilha:[^\]]+\])/g).map((p, i) =>
    p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith("[Planilha:") ? <span key={i} className="mx-0.5 rounded bg-primary/15 px-1 text-xs text-primary">{p.slice(1, -1)}</span> : p,
  );
}
function Markdown({ texto }: { texto: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-foreground/90">
      {texto.split("\n").map((l, i) => {
        if (/^#{1,3}\s/.test(l)) return <h3 key={i} className="font-display pt-3 text-base font-semibold text-foreground">{inline(l.replace(/^#+\s/, ""))}</h3>;
        if (/^\s*[-*]\s/.test(l)) return <p key={i} className="pl-4 before:-ml-3 before:mr-2 before:text-primary before:content-['•']">{inline(l.replace(/^\s*[-*]\s/, ""))}</p>;
        if (/^\s*\d+\.\s/.test(l)) return <p key={i} className="pl-4">{inline(l.trim())}</p>;
        return l.trim() ? <p key={i}>{inline(l)}</p> : null;
      })}
    </div>
  );
}

function Analise() {
  const { data, dataset, filters, bases } = useRelmeg();
  const [pergunta, setPergunta] = useState("");
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const columns = dataset?.columns ?? [];
  const filtrados = aplicarFiltros(data, filters);

  const gerar = async () => {
    if (!dataset) return;
    setBusy(true); setTexto("");
    const ctrl = new AbortController(); abort.current = ctrl;
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/analise", {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token ?? ""}` },
        body: JSON.stringify({ pergunta, contexto: montarContexto(filtrados, columns, dataset.name) }),
      });
      if (!res.ok || !res.body) {
        const msg = res.status === 402 ? "Créditos de IA esgotados. Adicione créditos ao workspace para continuar." : res.status === 429 ? "Muitas solicitações. Aguarde um pouco e tente de novo." : (await res.text()) || "Falha ao gerar a análise.";
        throw new Error(msg);
      }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let acc = "";
      for (;;) { const { done, value } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); setTexto(acc); }
      if (!acc.trim()) throw new Error("A IA não retornou conteúdo. Tente reformular o pedido.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error((e as Error).message);
    } finally { setBusy(false); abort.current = null; }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Análise com IA</h1>
        <p className="text-sm text-muted-foreground">Conclusões automáticas com referências às planilhas de origem, respeitando os filtros aplicados.</p>
      </div>
      {!dataset || !data.length ? (
        <EmptyState titulo="Sem dados para analisar" descricao="Importe uma ou mais planilhas no painel Admin para gerar análises." />
      ) : (
        <>
          <FilterBar data={data} columns={columns} />
          <section className="panel space-y-3 rounded-xl p-4 sm:p-6">
            <p className="text-sm text-muted-foreground">{filtrados.length} registros · {bases.length} planilha(s) carregada(s) · visão: {dataset.name}</p>
            <Textarea value={pergunta} onChange={(e) => setPergunta(e.target.value)} placeholder="Opcional: o que você quer descobrir? Ex.: Quais temas concentram mais apoio e como isso se cruza entre as planilhas?" rows={3} />
            <div className="flex flex-wrap gap-2">
              {busy ? <Button variant="outline" onClick={() => abort.current?.abort()}><Square />Parar</Button> : <Button onClick={gerar} disabled={!filtrados.length}><Sparkles />Gerar análise</Button>}
              {texto && !busy && <Button variant="outline" onClick={() => { void navigator.clipboard.writeText(texto); toast.success("Análise copiada"); }}><Copy />Copiar</Button>}
            </div>
          </section>
          {(texto || busy) && (
            <section className="panel rounded-xl p-4 sm:p-6" aria-live="polite">
              {texto ? <Markdown texto={texto} /> : <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Analisando os dados…</p>}
            </section>
          )}
        </>
      )}
    </div>
  );
}
