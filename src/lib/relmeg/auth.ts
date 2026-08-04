/**
 * Autenticação local (usuário único).
 * A estrutura é baseada em uma lista de usuários para permitir, no futuro,
 * múltiplos usuários sem grandes alterações — hoje apenas um usuário padrão.
 */
export type Usuario = {
  login: string;
  senha: string;
  nome: string;
};

export const USUARIOS_PADRAO: Usuario[] = [
  { login: "admin", senha: "relgov2026", nome: "Admin" },
];

const USUARIOS_KEY = "relmeg:usuarios";

export function lerUsuarios(): Usuario[] {
  if (typeof window === "undefined") return USUARIOS_PADRAO;
  try {
    const raw = window.localStorage.getItem(USUARIOS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Usuario[]) : null;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    /* ignora */
  }
  return USUARIOS_PADRAO;
}

export function salvarUsuarios(usuarios: Usuario[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
}

export function autenticar(login: string, senha: string): Usuario | null {
  const alvo = login.trim().toLowerCase();
  return lerUsuarios().find((u) => u.login.toLowerCase() === alvo && u.senha === senha) ?? null;
}

export function alterarSenha(login: string, senhaAtual: string, novaSenha: string): boolean {
  const usuarios = lerUsuarios();
  const idx = usuarios.findIndex((u) => u.login.toLowerCase() === login.toLowerCase() && u.senha === senhaAtual);
  if (idx === -1) return false;
  usuarios[idx] = { ...usuarios[idx]!, senha: novaSenha };
  salvarUsuarios(usuarios);
  return true;
}
