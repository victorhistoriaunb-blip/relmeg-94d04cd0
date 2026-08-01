export const CREDENCIAIS = {
  email: "victoripolunb@gmail.com",
  senha: "Desouza14@",
};

export function validarCredenciais(email: string, senha: string) {
  return email.trim().toLowerCase() === CREDENCIAIS.email && senha === CREDENCIAIS.senha;
}
