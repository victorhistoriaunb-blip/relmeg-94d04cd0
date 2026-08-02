export type Parlamentar = {
  id: string;
  nome: string;
  partido: string;
  uf: string;
  cargo: string;
  temaInteresse1: string;
  temaInteresse2: string;
  temaContrario1: string;
  temaContrario2: string;
  setor1: string;
  setor2: string;
  setor3: string;
  descricao: string;
  frentes: string;
  grupos: string;
  proposicao1: string;
  proposicao2: string;
  proposicao3: string;
  anotacoes: string;
};

export type Filters = {
  busca: string;
  partido: string;
  uf: string;
  cargo: string;
  setor: string;
  temaInteresse: string;
  temaContrario: string;
};

export const EMPTY_FILTERS: Filters = {
  busca: "",
  partido: "",
  uf: "",
  cargo: "",
  setor: "",
  temaInteresse: "",
  temaContrario: "",
};

export const CAMPOS: { key: keyof Omit<Parlamentar, "id">; label: string; aliases: string[]; obrigatorio?: boolean }[] = [
  { key: "nome", label: "Nome", aliases: ["nome", "nomedoparlamentar", "parlamentar"], obrigatorio: true },
  { key: "partido", label: "Partido", aliases: ["partido"], obrigatorio: true },
  { key: "uf", label: "UF", aliases: ["uf", "estado"], obrigatorio: true },
  { key: "cargo", label: "Cargo", aliases: ["cargo"], obrigatorio: true },
  {
    key: "temaInteresse1",
    label: "Tema de Interesse 1",
    aliases: ["temadeinteresse1", "temainteresse1", "interesse1", "tema1"],
    obrigatorio: true,
  },
  {
    key: "temaInteresse2",
    label: "Tema de Interesse 2",
    aliases: ["temadeinteresse2", "temainteresse2", "interesse2", "tema2"],
    obrigatorio: true,
  },
  {
    key: "temaContrario1",
    label: "Tema Contrário 1",
    aliases: ["temacontrario1", "contrario1", "temacontra1"],
    obrigatorio: true,
  },
  {
    key: "temaContrario2",
    label: "Tema Contrário 2",
    aliases: ["temacontrario2", "contrario2", "temacontra2"],
    obrigatorio: true,
  },
  { key: "setor1", label: "Setor 1", aliases: ["setor1", "setor"], obrigatorio: true },
  { key: "setor2", label: "Setor 2", aliases: ["setor2"] },
  { key: "setor3", label: "Setor 3", aliases: ["setor3"] },
  { key: "descricao", label: "Breve Descrição", aliases: ["brevedescricao", "descricao", "brevedescrição", "descrição"] },
  { key: "frentes", label: "Frentes Parlamentares", aliases: ["frentesparlamentares", "frentes", "frente"] },
  { key: "grupos", label: "Grupos de Trabalho", aliases: ["gruposdetrabalho", "grupos", "gt"] },
  { key: "proposicao1", label: "Proposição 1", aliases: ["proposicao1", "proposição1"] },
  { key: "proposicao2", label: "Proposição 2", aliases: ["proposicao2", "proposição2"] },
  { key: "proposicao3", label: "Proposição 3", aliases: ["proposicao3", "proposição3"] },
  { key: "anotacoes", label: "Anotações Internas", aliases: ["anotacoesinternas", "anotacoes", "anotações", "anotaçõesinternas"] },
];

export const OBRIGATORIOS = CAMPOS.filter((c) => c.obrigatorio).map((c) => c.key);

export function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const limpar = (values: string[]) => values.map((s) => (s ?? "").trim()).filter(Boolean);

export function setoresDe(p: Parlamentar) {
  return limpar([p.setor1, p.setor2, p.setor3]);
}

export function temasInteresseDe(p: Parlamentar) {
  return limpar([p.temaInteresse1, p.temaInteresse2]);
}

export function temasContrariosDe(p: Parlamentar) {
  return limpar([p.temaContrario1, p.temaContrario2]);
}

export function proposicoesDe(p: Parlamentar) {
  return limpar([p.proposicao1, p.proposicao2, p.proposicao3]);
}

export function linkDe(texto: string) {
  const match = texto.match(/https?:\/\/\S+/);
  return match ? match[0] : "";
}

export function briefing(p: Parlamentar) {
  const interesses = temasInteresseDe(p);
  const contrarios = temasContrariosDe(p);
  const proposicoes = proposicoesDe(p);
  const linhas = [
    `BRIEFING — ${p.nome}`,
    [p.cargo, p.partido && p.uf ? `${p.partido}/${p.uf}` : p.partido || p.uf].filter(Boolean).join(" • "),
    "",
    interesses.length ? `Temas de interesse: ${interesses.join(", ")}` : "",
    contrarios.length ? `Temas contrários: ${contrarios.join(", ")}` : "",
    setoresDe(p).length ? `Setores: ${setoresDe(p).join(", ")}` : "",
    p.descricao ? `\nAtuação:\n${p.descricao}` : "",
    p.frentes ? `Frentes parlamentares: ${p.frentes}` : "",
    p.grupos ? `Grupos de trabalho: ${p.grupos}` : "",
    proposicoes.length ? `\nProposições:\n${proposicoes.map((x) => `- ${x}`).join("\n")}` : "",
    p.anotacoes ? `\nAnotações internas:\n${p.anotacoes}` : "",
  ];
  return linhas.filter((l) => l !== "").join("\n");
}
