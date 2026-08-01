import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CAMPOS } from "@/lib/relmeg/types";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Central de Ajuda — RelMeg" },
      {
        name: "description",
        content: "Como preparar a planilha, importar dados, usar filtros, interpretar gráficos e copiar briefings no RelMeg.",
      },
      { property: "og:title", content: "Central de Ajuda — RelMeg" },
      { property: "og:description", content: "Guia de uso do RelMeg para times de Relações Governamentais." },
    ],
  }),
  component: Ajuda,
});

const topicos = [
  {
    titulo: "Como preparar a planilha",
    conteudo:
      "Use a primeira linha como cabeçalho, com uma coluna por campo. A ordem das colunas não importa — o RelMeg reconhece os nomes automaticamente. Linhas sem o nome do parlamentar são ignoradas.",
  },
  {
    titulo: "Como importar dados",
    conteudo:
      "Acesse Admin, faça login, envie o arquivo .xlsx ou .csv, confira a pré-visualização e a validação das colunas e confirme a importação. Os dados ficam salvos no seu navegador (LocalStorage).",
  },
  {
    titulo: "Como utilizar filtros",
    conteudo:
      "No Catálogo e nos Dashboards, combine busca livre com filtros de Partido, UF, Cargo, Setor e Termômetro. Os filtros são cumulativos e compartilhados entre as páginas. Use 'Limpar Filtros' para reiniciar a seleção.",
  },
  {
    titulo: "Como interpretar gráficos",
    conteudo:
      "Os dashboards refletem exatamente o recorte filtrado: distribuição por UF e Partido mostram concentração territorial e partidária; Cargo indica a composição da base; Setor revela temas prioritários; Termômetro compara o posicionamento agregado.",
  },
  {
    titulo: "Como copiar briefings",
    conteudo:
      "Clique em um parlamentar para abrir o painel lateral e use 'Copiar Briefing'. O texto sai formatado com identificação, posicionamento, setores, descrição, proposições e anotações internas.",
  },
];

function Ajuda() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Central de Ajuda</h1>
        <p className="text-sm text-muted-foreground">Guia rápido de operação do RelMeg.</p>
      </div>

      <div className="panel rise-in rounded-lg p-5">
        <h2 className="text-sm font-semibold">Colunas reconhecidas</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CAMPOS.map((c) => (
            <Badge key={c.key} variant="secondary" className="font-normal">
              {c.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="panel rounded-lg px-5">
        <Accordion type="single" collapsible defaultValue="0">
          {topicos.map((t, i) => (
            <AccordionItem key={t.titulo} value={String(i)}>
              <AccordionTrigger className="text-left">{t.titulo}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{t.conteudo}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}