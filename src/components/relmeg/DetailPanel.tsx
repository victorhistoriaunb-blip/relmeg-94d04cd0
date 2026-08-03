import { Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  briefing,
  proposicoesDe,
  setoresDe,
  temasContrariosDe,
  temasInteresseDe,
  type Parlamentar,
} from "@/lib/relmeg/types";

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{titulo}</h3>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </section>
  );
}

export function DetailPanel({
  parlamentar,
  onClose,
}: {
  parlamentar: Parlamentar | null;
  onClose: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!parlamentar) return;
    try {
      await navigator.clipboard.writeText(briefing(parlamentar));
      setCopiado(true);
      toast.success("Briefing copiado para a área de transferência");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o briefing");
    }
  }

  const proposicoes = parlamentar ? proposicoesDe(parlamentar) : [];

  return (
    <Sheet open={!!parlamentar} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 border-border bg-card p-0 sm:max-w-lg">
        {parlamentar && (
          <>
            <SheetHeader className="border-b border-border p-6">
              <SheetTitle className="font-display text-2xl">{parlamentar.nome}</SheetTitle>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="secondary">{parlamentar.cargo || "Cargo não informado"}</Badge>
                <Badge variant="outline">
                  {[parlamentar.partido, parlamentar.uf].filter(Boolean).join("/") || "—"}
                </Badge>
              </div>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-13rem)]">
              <div className="space-y-6 p-6">
                {temasInteresseDe(parlamentar).length > 0 && (
                  <Bloco titulo="Temas de Interesse">
                    <div className="flex flex-wrap gap-1.5">
                      {temasInteresseDe(parlamentar).map((t) => (
                        <Badge key={t} variant="outline" className="border-success/40 bg-success/15 text-success">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </Bloco>
                )}
                {temasContrariosDe(parlamentar).length > 0 && (
                  <Bloco titulo="Temas Contrários">
                    <div className="flex flex-wrap gap-1.5">
                      {temasContrariosDe(parlamentar).map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="border-destructive/40 bg-destructive/15 text-destructive"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </Bloco>
                )}
                {setoresDe(parlamentar).length > 0 && (
                  <Bloco titulo="Setores">
                    <div className="flex flex-wrap gap-1.5">
                      {setoresDe(parlamentar).map((s) => (
                        <Badge key={s} variant="secondary">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </Bloco>
                )}
                {parlamentar.descricao && <Bloco titulo="Breve descrição">{parlamentar.descricao}</Bloco>}
                {proposicoes.length > 0 && (
                  <Bloco titulo="Proposições">
                    <ul className="space-y-2">
                      {proposicoes.map((p, i) => (
                        <li
                          key={`${p.numero}-${i}`}
                          className="rounded-md border border-border bg-muted/40 px-3 py-2"
                        >
                          {p.numero && <p className="font-medium">{p.numero}</p>}
                          {p.ementa && <p className="mt-0.5 text-sm text-muted-foreground">{p.ementa}</p>}
                          {p.link && (
                            <a
                              href={p.link}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> Abrir proposição
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Bloco>
                )}
                {parlamentar.anotacoes && (
                  <Bloco titulo="Anotações internas">
                    <p className="rounded-md border border-dashed border-border px-3 py-2 text-muted-foreground">
                      {parlamentar.anotacoes}
                    </p>
                  </Bloco>
                )}
              </div>
            </ScrollArea>
            <div className="border-t border-border p-4">
              <Button className="w-full" onClick={copiar}>
                {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copiar Briefing
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
