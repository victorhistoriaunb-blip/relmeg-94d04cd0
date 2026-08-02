export type Textos = {
  perfisTitulo: string;
  perfisDescricao: string;
  dashboardsTitulo: string;
  dashboardsDescricao: string;
  ajudaTitulo: string;
  ajudaDescricao: string;
  institucional: string;
};

export const TEXTOS_PADRAO: Textos = {
  perfisTitulo: "Perfis",
  perfisDescricao:
    "Consulte parlamentares por tema estratégico, setor e recorte territorial para mapear apoios e resistências.",
  dashboardsTitulo: "Dashboards",
  dashboardsDescricao:
    "Análises geradas automaticamente a partir da base importada. Clique em uma categoria para filtrar.",
  ajudaTitulo: "Central de Ajuda",
  ajudaDescricao: "Guia rápido de operação do RelMeg.",
  institucional:
    "RelMeg é a plataforma de inteligência legislativa para times de Relações Governamentais mapearem stakeholders por tema estratégico.",
};

export const CAMPOS_TEXTO: { key: keyof Textos; label: string; multiline?: boolean }[] = [
  { key: "perfisTitulo", label: "Título — Perfis" },
  { key: "perfisDescricao", label: "Descrição — Perfis", multiline: true },
  { key: "dashboardsTitulo", label: "Título — Dashboards" },
  { key: "dashboardsDescricao", label: "Descrição — Dashboards", multiline: true },
  { key: "ajudaTitulo", label: "Título — Central de Ajuda" },
  { key: "ajudaDescricao", label: "Descrição — Central de Ajuda", multiline: true },
  { key: "institucional", label: "Texto institucional", multiline: true },
];
