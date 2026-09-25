export type CardPref = {
  key: string;
  titulo: string;
  descricao: string;
  visivel: boolean;
  limite?: number;
};

export type Prefs = {
  saudacao: string;
  nomeExibicao: string;
  mostrarSaudacao: boolean;
  mostrarKpisPerfis: boolean;
  visaoPadraoPerfis: "cards" | "tabela";
  kpis: CardPref[];
  paineis: CardPref[];
};

export const KPIS_PADRAO: CardPref[] = [
  { key: "registros", titulo: "Registros", descricao: "na seleção atual", visivel: true },
  { key: "colunas", titulo: "Colunas", descricao: "detectadas na base", visivel: true },
  { key: "preenchidos", titulo: "Dados preenchidos", descricao: "células com conteúdo", visivel: true },
  { key: "numericos", titulo: "Campos numéricos", descricao: "disponíveis para cálculos", visivel: true },
];

/** Os dashboards agora são criados e organizados na própria página Dashboards. */
export const PAINEIS_PADRAO: CardPref[] = [];

export const PREFS_PADRAO: Prefs = {
  saudacao: "Olá",
  nomeExibicao: "Admin",
  mostrarSaudacao: true,
  mostrarKpisPerfis: true,
  visaoPadraoPerfis: "cards",
  kpis: KPIS_PADRAO,
  paineis: PAINEIS_PADRAO,
};

/** Mescla preferências salvas com os padrões, preservando ordem salva e novos cards. */
function mesclarCards(salvos: CardPref[] | undefined, padrao: CardPref[]): CardPref[] {
  if (!Array.isArray(salvos)) return padrao.map((c) => ({ ...c }));
  const validos = salvos.filter((s) => padrao.some((p) => p.key === s.key));
  const faltantes = padrao.filter((p) => !validos.some((s) => s.key === p.key));
  return [...validos, ...faltantes].map((c) => {
    const base = padrao.find((p) => p.key === c.key)!;
    return { ...base, ...c };
  });
}

export function mesclarPrefs(salvo: Partial<Prefs> | null | undefined): Prefs {
  if (!salvo) return { ...PREFS_PADRAO, kpis: KPIS_PADRAO.map((c) => ({ ...c })), paineis: PAINEIS_PADRAO.map((c) => ({ ...c })) };
  return {
    ...PREFS_PADRAO,
    ...salvo,
    kpis: mesclarCards(salvo.kpis, KPIS_PADRAO),
    paineis: mesclarCards(salvo.paineis, PAINEIS_PADRAO),
  };
}
