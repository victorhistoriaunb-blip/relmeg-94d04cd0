import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CAMPOS } from "@/lib/relmeg/types";
import { Badge } from "@/components/ui/badge";
import { useRelmeg } from "@/lib/relmeg/store";

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Central de Ajuda — RelMeg" },
      {
        name: "description",
        content:
          "Como importar a planilha, preencher campos, cadastrar temas de interesse e contrários, usar filtros e acessar perfis.",
      },
      { property: "og:title", content: "Central de Ajuda — RelMeg" },
      { property: "og:description", content: "Guia de uso do RelMeg para times de Relações Governamentais." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ajuda,
});

const topicos = [
  {
    titulo: "Como importar a planilha",
    conteudo:
      "Acesse Admin, envie o arquivo .xlsx ou .csv, confira a pré-visualização e a validação das colunas e confirme a importação. Cada linha representa um parlamentar e os dados ficam salvos no seu navegador (LocalStorage).",
  },
  {
    titulo: "Como preencher os campos",
    conteudo:
      "Obrigatórios: Nome, Partido, UF, Cargo, Tema de Interesse 1 e 2, Tema Contrário 1 e 2 e Setor 1. Opcionais: Setor 2, Setor 3, Breve Descrição, Frentes Parlamentares, Grupos de Trabalho, Proposição 1 a 3 e Anotações Internas. Campos opcionais podem ficar vazios sem bloquear a importação.",
  },
  {
    titulo: "Como cadastrar temas",
    conteudo:
      "Use um tema por coluna, com nomenclatura padronizada (ex.: 'Energia Renovável'). O sistema consolida Tema de Interesse 1 e 2 em uma única base de temas de interesse, e Tema Contrário 1 e 2 em temas contrários — a numeração não influencia filtros nem gráficos.",
  },
  {
    titulo: "Como interpretar temas de interesse e temas contrários",
    conteudo:
      "Temas de interesse indicam afinidade, atuação ou alinhamento do parlamentar com a pauta. Temas contrários indicam oposição, resistência ou posicionamento adverso. Nos perfis eles aparecem em verde e vermelho, e nos dashboards alimentam os painéis de maior apoio e maior resistência.",
  },
  {
    titulo: "Como utilizar filtros",
    conteudo:
      "Combine busca livre com filtros de Tema de Interesse, Tema Contrário, Setor, Partido, UF e Cargo. Os filtros são cumulativos e compartilhados entre Perfis e Dashboards. Clicar em uma barra ou fatia de gráfico aplica o filtro correspondente. Use 'Limpar Filtros' para reiniciar.",
  },
  {
    titulo: "Como acessar perfis",
    conteudo:
      "Em Perfis, clique em um card ou linha da tabela para abrir a ficha analítica com informações principais, temas de interesse, temas contrários, setores, atuação, proposições e anotações internas. Use 'Copiar Briefing' para gerar um resumo pronto para compartilhar.",
  },
];

function Ajuda() {
  const { textos } = useRelmeg();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{textos.ajudaTitulo}</h1>
        <p className="text-sm text-muted-foreground">{textos.ajudaDescricao}</p>
      </div>

      <div className="panel panel-hover rise-in rounded-xl p-5">
        <h2 className="text-sm font-semibold">Colunas reconhecidas</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CAMPOS.map((c) => (
            <Badge key={c.key} variant={c.obrigatorio ? "default" : "secondary"} className="font-normal">
              {c.label}
              {c.obrigatorio ? " *" : ""}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">* campos obrigatórios</p>
      </div>

      <div className="panel panel-hover rounded-xl px-5">
        <Accordion type="single" collapsible defaultValue="0">
          {topicos.map((t, i) => (
            <AccordionItem key={t.titulo} value={String(i)}>
              <AccordionTrigger className="text-left">{t.titulo}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{t.conteudo}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="panel rounded-xl p-5 text-sm text-muted-foreground">{textos.institucional}</div>
    </div>
  );
}
