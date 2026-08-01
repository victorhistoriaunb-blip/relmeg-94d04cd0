import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Download, Trash2, LogOut, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LogoLockup } from "@/components/relmeg/Logo";
import { clearData, setAuth, setData, useRelmeg } from "@/lib/relmeg/store";
import { OBRIGATORIOS, CAMPOS, type Parlamentar } from "@/lib/relmeg/types";
import type { ParseResult } from "@/lib/relmeg/parse";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Importação de Base | RelMeg" },
      {
        name: "description",
        content: "Painel administrativo do RelMeg para importar planilhas Excel/CSV e gerenciar a base parlamentar.",
      },
      { property: "og:title", content: "Admin — Importação de Base | RelMeg" },
      { property: "og:description", content: "Importe, valide e gerencie sua base de parlamentares." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { auth } = useRelmeg();
  return auth ? <Painel /> : <Login />;
}

function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario.trim() || !senha.trim()) {
      toast.error("Informe usuário e senha");
      return;
    }
    setAuth(true);
    toast.success("Acesso liberado ao painel administrativo");
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form onSubmit={entrar} className="panel rise-in w-full max-w-sm space-y-5 rounded-lg p-7">
        <LogoLockup />
        <div>
          <h1 className="font-display text-xl font-semibold">Acesso administrativo</h1>
          <p className="text-sm text-muted-foreground">Área restrita à gestão da base parlamentar.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="usuario">Usuário</Label>
          <Input id="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full">
          Entrar
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          MVP local: a sessão fica apenas neste navegador.
        </p>
      </form>
    </div>
  );
}

function Painel() {
  const { data } = useRelmeg();
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [carregando, setCarregando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setCarregando(true);
    try {
      const { parseFile } = await import("@/lib/relmeg/parse");
      const resultado = await parseFile(file);
      if (resultado.rows.length === 0) {
        toast.error("Nenhuma linha válida encontrada. Verifique a coluna 'Nome do Parlamentar'.");
        setPreview(null);
      } else {
        setPreview(resultado);
        toast.success(`${resultado.rows.length} registros lidos do arquivo`);
      }
    } catch {
      toast.error("Não foi possível ler o arquivo. Use .xlsx ou .csv.");
    } finally {
      setCarregando(false);
    }
  }

  function confirmar() {
    if (!preview) return;
    setData(preview.rows);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    toast.success("Base importada com sucesso");
  }

  const faltandoObrigatorio = preview
    ? OBRIGATORIOS.filter((k) => preview.faltantes.includes(CAMPOS.find((c) => c.key === k)?.label ?? ""))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Admin</h1>
          <p className="text-sm text-muted-foreground">Importação e gestão da base parlamentar.</p>
        </div>
        <Button variant="ghost" onClick={() => setAuth(false)}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>

      <div className="panel rise-in rounded-lg p-6">
        <h2 className="font-display text-base font-semibold">Importar planilha</h2>
        <p className="text-sm text-muted-foreground">
          Formatos aceitos: Excel (.xlsx, .xls) e CSV. A importação substitui a base atual.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="max-w-sm"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <Button
            variant="outline"
            onClick={async () => {
              const { baixarModelo } = await import("@/lib/relmeg/parse");
              baixarModelo();
            }}
          >
            <Download className="h-4 w-4" /> Baixar modelo
          </Button>
          {carregando && <span className="text-sm text-muted-foreground">Lendo arquivo…</span>}
        </div>
      </div>

      {preview && (
        <div className="panel rise-in space-y-4 rounded-lg p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold">
              Pré-visualização — {preview.rows.length} registros
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setPreview(null)}>
                Cancelar
              </Button>
              <Button onClick={confirmar} disabled={faltandoObrigatorio.length > 0}>
                <UploadCloud className="h-4 w-4" /> Confirmar importação
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-success" /> Colunas reconhecidas
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {preview.reconhecidos.map((c) => (
                  <Badge key={c} variant="secondary" className="font-normal">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-warning" /> Colunas não encontradas
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {preview.faltantes.length === 0 ? (
                  <span className="text-sm text-muted-foreground">Nenhuma — planilha completa.</span>
                ) : (
                  preview.faltantes.map((c) => (
                    <Badge key={c} variant="outline" className="font-normal">
                      {c}
                    </Badge>
                  ))
                )}
              </div>
              {faltandoObrigatorio.length > 0 && (
                <p className="mt-2 text-xs text-destructive">
                  Campos obrigatórios ausentes (Nome, Partido, UF e Cargo). Ajuste a planilha para continuar.
                </p>
              )}
            </div>
          </div>

          <Tabela rows={preview.rows.slice(0, 8)} />
        </div>
      )}

      <div className="panel rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Base carregada</h2>
            <p className="text-sm text-muted-foreground">
              {data.length} parlamentares salvos localmente neste navegador.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={data.length === 0}
            onClick={() => {
              clearData();
              toast.success("Base removida");
            }}
          >
            <Trash2 className="h-4 w-4" /> Limpar base
          </Button>
        </div>
        {data.length > 0 && (
          <div className="mt-4">
            <Tabela rows={data.slice(0, 20)} />
          </div>
        )}
      </div>
    </div>
  );
}

function Tabela({ rows }: { rows: Parlamentar[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Partido</TableHead>
            <TableHead>UF</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Termômetro</TableHead>
            <TableHead>Setor 1</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.nome}</TableCell>
              <TableCell>{p.partido}</TableCell>
              <TableCell>{p.uf}</TableCell>
              <TableCell>{p.cargo}</TableCell>
              <TableCell>{p.termometro}</TableCell>
              <TableCell>{p.setor1}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}