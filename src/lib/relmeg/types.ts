export type Parlamentar = {
  id: string;
  nome: string;
  partido: string;
  uf: string;
  cargo: string;
  termometro: string;
  interesses: string;
  setor1: string;
  setor2: string;
  setor3: string;
  descricao: string;
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
  termometro: string;
};

export const EMPTY_FILTERS: Filters = {
  busca: "",
  partido: "",
  uf: "",
  cargo: "",
  setor: "",
  termometro: "",
};

export const CAMPOS: { key: keyof Omit<Parlamentar, "id">; label: string; aliases: string[] }[] = [
  { key: "nome", label: "Nome do Parlamentar", aliases: ["nome", "nomedoparlamentar", "parlamentar"] },
  { key: "partido", label: "Partido", aliases: ["partido"] },
  { key: "uf", label: "UF", aliases: ["uf", "estado"] },
  { key: "cargo", label: "Cargo", aliases: ["cargo"] },
  { key: "termometro", label: "Termômetro", aliases: ["termometro", "termômetro", "posicionamento"] },
  { key: "interesses", label: "Interesses", aliases: ["interesses", "interesse"] },
  { key: "setor1", label: "Setor 1", aliases: ["setor1", "setor"] },
  { key: "setor2", label: "Setor 2", aliases: ["setor2"] },
  { key: "setor3", label: "Setor 3", aliases: ["setor3"] },
  { key: "descricao", label: "Breve Descrição", aliases: ["brevedescricao", "descricao", "brevedescrição", "descrição"] },
  { key: "proposicao1", label: "Proposição 1", aliases: ["proposicao1", "proposição1"] },
  { key: "proposicao2", label: "Proposição 2", aliases: ["proposicao2", "proposição2"] },
  { key: "proposicao3", label: "Proposição 3", aliases: ["proposicao3", "proposição3"] },
  { key: "anotacoes", label: "Anotações Internas", aliases: ["anotacoesinternas", "anotacoes", "anotações", "anotaçõesinternas"] },
];

export const OBRIGATORIOS: (keyof Parlamentar)[] = ["nome", "partido", "uf", "cargo"];

export function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function setoresDe(p: Parlamentar) {
  return [p.setor1, p.setor2, p.setor3].map((s) => s.trim()).filter(Boolean);
}

export function isFavoravel(termometro: string) {
  const t = normalizeKey(termometro);
  return t.includes("favoravel") && !t.includes("desfavoravel") && !t.includes("naofavoravel");
}

export function briefing(p: Parlamentar) {
  const linhas = [
    `BRIEFING — ${p.nome}`,
    `${[p.cargo, p.partido && p.uf ? `${p.partido}/${p.uf}` : p.partido || p.uf].filter(Boolean).join(" • ")}`,
    "",
    p.termometro ? `Posicionamento: ${p.termometro}` : "",
    setoresDe(p).length ? `Setores: ${setoresDe(p).join(", ")}` : "",
    p.interesses ? `Interesses: ${p.interesses}` : "",
    p.descricao ? `\nDescrição:\n${p.descricao}` : "",
    [p.proposicao1, p.proposicao2, p.proposicao3].filter(Boolean).length
      ? `\nProposições:\n${[p.proposicao1, p.proposicao2, p.proposicao3]
          .filter(Boolean)
          .map((x) => `- ${x}`)
          .join("\n")}`
      : "",
    p.anotacoes ? `\nAnotações internas:\n${p.anotacoes}` : "",
  ];
  return linhas.filter((l) => l !== "").join("\n");
}