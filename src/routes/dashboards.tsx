import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiCards } from "@/components/relmeg/KpiCards";
import { EmptyState } from "@/components/relmeg/EmptyState";
import { FilterBar, aplicarFiltros } from "@/components/relmeg/FilterBar";
import { toggleFilter, useRelmeg } from "@/lib/relmeg/store";
import {
  setoresDe,
  temasContrariosDe,
  temasInteresseDe,
  type Filters,
  type Parlamentar,
} from "@/lib/relmeg/types";

export const Route = createFileRoute("/dashboards")({
  head: () => ({
    meta: [
      { title: "Dashboards Analíticos — RelMeg" },
      {
        name: "description",
        content:
          "Distribuição de parlamentares por UF, partido, cargo, setor, temas de interesse e temas contrários.",
      },
      { property: "og:title", content: "Dashboards Analíticos — RelMeg" },
      { property: "og:description", content: "Visualize apoios e resistências da sua base parlamentar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboards,
});

const CORES = [
  "oklch(0.7 0.17 250)",
  "oklch(0.78 0.13 215)",
  "oklch(0.76 0.15 190)",
  "oklch(0.68 0.18 285)",
  "oklch(0.84 0.1 235)",
];
const VERDE = "oklch(0.75 0.16 155)";
const VERMELHO = "oklch(0.7 0.19 22)";

function contar(values: string[], limite = 0) {
  const counts = new Map<string, number>();
  values
    .map((v) => v.trim())
    .filter(Boolean)
    .forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  const list = [...counts.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
  return limite ? list.slice(0, limite) : list;
}

const EIXO = "oklch(0.82 0.02 258)";
const REALCE = "oklch(0.38 0.055 258)";

const tooltipStyle = {
  backgroundColor: "oklch(0.22 0.038 264)",
  border: "1px solid oklch(0.42 0.05 262)",
  borderRadius: 8,
  color: "oklch(0.98 0.008 250)",
  fontSize: 12,
};
const tooltipItemStyle = { color: "oklch(0.98 0.008 250)" };
const tooltipLabelStyle = { color: "oklch(0.86 0.02 250)", fontWeight: 600 };

function Painel({
  titulo,
  descricao,
  altura = 300,
  children,
}: {
  titulo: string;
  descricao: string;
  altura?: number;
  children: React.ReactElement;
}) {
  return (
    <div className="panel panel-hover rise-in rounded-xl p-5">
      <h2 className="font-display text-base font-semibold">{titulo}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{descricao}</p>
      <ResponsiveContainer width="100%" height={altura}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function Dashboards() {
  const { data, filters, textos } = useRelmeg();
  const filtrados: Parlamentar[] = aplicarFiltros(data, filters);

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <Titulo titulo={textos.dashboardsTitulo} descricao={textos.dashboardsDescricao} />
        <EmptyState
          titulo="Sem dados para analisar"
          descricao="Os dashboards são gerados a partir da base importada. Envie uma planilha no painel Admin para visualizar os gráficos."
        />
      </div>
    );
  }

  const clique = (key: keyof Filters) => (payload: { name?: string } | undefined) => {
    if (payload?.name) toggleFilter(key, payload.name);
  };

  const porUf = contar(filtrados.map((p) => p.uf), 15);
  const porPartido = contar(filtrados.map((p) => p.partido), 8);
  const porCargo = contar(filtrados.map((p) => p.cargo));
  const porSetor = contar(filtrados.flatMap(setoresDe), 10);
  const porInteresse = contar(filtrados.flatMap(temasInteresseDe), 10);
  const porContrario = contar(filtrados.flatMap(temasContrariosDe), 10);

  return (
    <div className="space-y-6">
      <Titulo titulo={textos.dashboardsTitulo} descricao={textos.dashboardsDescricao} />
      <KpiCards data={filtrados} />
      <FilterBar data={data} />

      <div className="grid gap-4 xl:grid-cols-2">
        <Painel
          titulo="Temas de Interesse"
          descricao="Top 10 temas com maior apoio — clique para filtrar"
          altura={340}
        >
          <BarChart data={porInteresse} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" stroke={EIXO} fontSize={12} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={140} stroke={EIXO} fontSize={11} />
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              cursor={{ fill: REALCE, opacity: 0.4 }}
            />
            <Bar dataKey="total" fill={VERDE} radius={[0, 4, 4, 0]} cursor="pointer" onClick={clique("temaInteresse")} />
          </BarChart>
        </Painel>

        <Painel
          titulo="Temas Contrários"
          descricao="Top 10 temas com maior resistência — clique para filtrar"
          altura={340}
        >
          <BarChart data={porContrario} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" stroke={EIXO} fontSize={12} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={140} stroke={EIXO} fontSize={11} />
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              cursor={{ fill: REALCE, opacity: 0.4 }}
            />
            <Bar dataKey="total" fill={VERMELHO} radius={[0, 4, 4, 0]} cursor="pointer" onClick={clique("temaContrario")} />
          </BarChart>
        </Painel>

        <Painel titulo="Parlamentares por UF" descricao="Top 15 unidades federativas — clique para filtrar" altura={360}>
          <BarChart data={porUf} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" stroke={EIXO} fontSize={12} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={48} stroke={EIXO} fontSize={12} />
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              cursor={{ fill: REALCE, opacity: 0.4 }}
            />
            <Bar dataKey="total" fill={CORES[0]} radius={[0, 4, 4, 0]} cursor="pointer" onClick={clique("uf")} />
          </BarChart>
        </Painel>

        <Painel titulo="Parlamentares por Partido" descricao="Top 8 partidos — clique para filtrar" altura={360}>
          <PieChart>
            <Pie
              data={porPartido}
              dataKey="total"
              nameKey="name"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              cursor="pointer"
              onClick={clique("partido")}
            >
              {porPartido.map((entry, i) => (
                <Cell key={entry.name} fill={CORES[i % CORES.length]} stroke="oklch(0.235 0.021 259)" />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12, color: "oklch(0.92 0.01 250)" }} />
            <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
          </PieChart>
        </Painel>

        <Painel titulo="Parlamentares por Cargo" descricao="Composição da base por função — clique para filtrar">
          <BarChart data={porCargo}>
            <XAxis dataKey="name" stroke={EIXO} fontSize={12} />
            <YAxis stroke={EIXO} fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              cursor={{ fill: REALCE, opacity: 0.4 }}
            />
            <Bar dataKey="total" fill={CORES[1]} radius={[4, 4, 0, 0]} cursor="pointer" onClick={clique("cargo")} />
          </BarChart>
        </Painel>

        <Painel titulo="Parlamentares por Setor" descricao="Top 10 setores de atuação — clique para filtrar">
          <BarChart data={porSetor}>
            <XAxis dataKey="name" stroke={EIXO} fontSize={11} interval={0} angle={-20} height={56} textAnchor="end" />
            <YAxis stroke={EIXO} fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              cursor={{ fill: REALCE, opacity: 0.4 }}
            />
            <Bar dataKey="total" fill={CORES[2]} radius={[4, 4, 0, 0]} cursor="pointer" onClick={clique("setor")} />
          </BarChart>
        </Painel>
      </div>
    </div>
  );
}

function Titulo({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">{titulo}</h1>
      <p className="text-sm text-muted-foreground">{descricao}</p>
    </div>
  );
}
