import { useState } from "react";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "./Logo";
import { setAuth } from "@/lib/relmeg/store";
import { validarCredenciais } from "@/lib/relmeg/auth";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !senha) {
      toast.error("Informe e-mail e senha");
      return;
    }
    setCarregando(true);
    window.setTimeout(() => {
      if (validarCredenciais(email, senha)) {
        setAuth(true);
        toast.success("Bem-vindo ao RelMeg");
      } else {
        toast.error("Credenciais inválidas");
        setCarregando(false);
      }
    }, 450);
  }

  return (
    <div className="aurora relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="grid-veil" aria-hidden="true" />
      <div className="rise-in relative w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <span className="glow-ring flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Logo className="h-14 w-14" />
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">RelMeg</h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
            Inteligência Legislativa
          </p>
        </div>

        <form onSubmit={entrar} className="panel mt-8 space-y-5 rounded-xl p-7">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
