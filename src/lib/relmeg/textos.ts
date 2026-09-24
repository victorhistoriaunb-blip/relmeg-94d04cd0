export type Textos = {
  perfisTitulo: string;
  perfisSubtitulo: string;
  dashboardsTitulo: string;
  dashboardsSubtitulo: string;
  ajudaIntro: string;
};

export const TEXTOS_PADRAO: Textos = {
  perfisTitulo: "Dados",
  perfisSubtitulo: "Explore, pesquise e edite os registros da sua base ativa.",
  dashboardsTitulo: "Dashboards",
  dashboardsSubtitulo: "Crie análises a partir de qualquer coluna da base importada.",
  ajudaIntro: "Guia rápido de operação do RelMeg.",
};

export const CAMPOS_TEXTO: { key: keyof Textos; label: string; multi?: boolean }[] = [
  { key: "perfisTitulo", label: "Título da página Dados" },
  { key: "perfisSubtitulo", label: "Subtítulo da página Dados", multi: true },
  { key: "dashboardsTitulo", label: "Título dos Dashboards" },
  { key: "dashboardsSubtitulo", label: "Subtítulo dos Dashboards", multi: true },
  { key: "ajudaIntro", label: "Introdução da Central de Ajuda", multi: true },
];
