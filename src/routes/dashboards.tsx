import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { useRelmeg } from "@/lib/relmeg/store";
import { setoresDe, temasContrariosDe, temasInteresseDe, type Parlamentar } from "@/lib/relmeg/types";

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
      { property: "og:description", content: "Visualize sua base parlamentar em indicadores e gráficos dinâmicos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboards,
});

const CORES = [
  "oklch(0.72 0.17 255)",
  "oklch(0.79 0.13 215)",
  "oklch(0.76 0.14 195)",
  "oklch(0.68 0.18 285)",
  "oklch(0.84 0.1 235)",
];

const VERDE = "oklch(0.76 0.15 155)";
const VERMELHO = "oklch(0.7 0.17 20)";

function contar(values: string[], limite = 0) {
  const counts = new Map<string, number>();
  values.map((v) => v.trim()).filter(Boolean).forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  const list = [...counts.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
  return limite ? list.slice(0, limite) : list;
}

const EIXO = "oklch(0.86 0.02 258)";
const GRADE = "oklch(0.32 0.035 260)";
const REALCE = "oklch(0.42 0.055 258)";

const tooltipStyle = {
  backgroundColor: "oklch(0.21 0.038 264)",
  border: "1px solid oklch(0.42 0.05 262)",
  borderRadius: 8,
  color: "oklch(0.98 0.008 250)",
  fontSize: 12,
};

const tick = { fill: EIXO, fontSize: 12 };

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

  const Titulo = () => (
    <div>
      <h1 className="font-display text-2xl font-semibold">{textos.dashboardsTitulo}</h1>
      <p className="text-sm text-muted-foreground">{textos.dashboardsSubtitulo}</p>
    </div>
  );

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <Titulo />
        <EmptyState
          titulo="Sem dados para analisar"
          descricao="Os dashboards são gerados a partir da base importada. Envie uma planilha no painel Admin para visualizar os gráficos."
        />
      </div>
    );
  }

  const porUf = contar(filtrados.map((p) => p.uf), 15);
  const porPartido = contar(filtrados.map((p) => p.partido), 8);
  const porCargo = contar(filtrados.map((p) => p.cargo));
  const porSetor = contar(filtrados.flatMap(setoresDe), 10);
  const porInteresse = contar(filtrados.flatMap(temasInteresseDe), 10);
  const porContrario = contar(filtrados.flatMap(temasContrariosDe), 10);

  return (
    <div className="space-y-6">
      <Titulo />
      <KpiCards data={filtrados} />
      <FilterBar data={data} />

      <div className="grid gap-4 xl:grid-cols-2">
        <Painel titulo="Temas de Interesse" descricao="Top 10 temas com maior apoio" altura={360}>
          <BarChart data={porInteresse} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} stroke={GRADE} />
            <XAxis type="number" stroke={EIXO} tick={tick} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={150} stroke={EIXO} tick={tick} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: REALCE, opacity: 0.3 }} />
            <Bar dataKey="total" fill={VERDE} radius={[0, 4, 4, 0]} />
          </BarChart>
        </Painel>

        <Painel titulo="Temas Contrários" descricao="Top 10 temas com maior resistência" altura={360}>
          <BarChart data={porContrario} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} stroke={GRADE} />
            <XAxis type="number" stroke={EIXO} tick={tick} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={150} stroke={EIXO} tick={tick} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: REALCE, opacity: 0.3 }} />
            <Bar dataKey="total" fill={VERMELHO} radius={[0, 4, 4, 0]} />
          </BarChart>
        </Painel>

        <Painel titulo="Parlamentares por UF" descricao="Top 15 unidades federativas" altura={360}>
          <BarChart data={porUf} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} stroke={GRADE} />
            <XAxis type="number" stroke={EIXO} tick={tick} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={48} stroke={EIXO} tick={tick} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: REALCE, opacity: 0.3 }} />
            <Bar dataKey="total" fill={CORES[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </Painel>

        <Painel titulo="Parlamentares por Partido" descricao="Top 8 partidos" altura={360}>
          <PieChart>
            <Pie data={porPartido} dataKey="total" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
              {porPartido.map((entry, i) => (
                <Cell key={entry.name} fill={CORES[i % CORES.length]} stroke="oklch(0.235 0.021 259)" />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12, color: EIXO }} />
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </Painel>

        <Painel titulo="Parlamentares por Cargo" descricao="Composição da base por função">
          <BarChart data={porCargo}>
            <CartesianGrid vertical={false} stroke={GRADE} />
            <XAxis dataKey="name" stroke={EIXO} tick={tick} />
            <YAxis stroke={EIXO} tick={tick} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: REALCE, opacity: 0.3 }} />
            <Bar dataKey="total" fill={CORES[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </Painel>

        <Painel titulo="Parlamentares por Setor" descricao="Top 10 setores de atuação">
          <BarChart data={porSetor} margin={{ bottom: 8 }}>
            <CartesianGrid vertical={false} stroke={GRADE} />
            <XAxis
              dataKey="name"
              stroke={EIXO}
              tick={{ fill: EIXO, fontSize: 11 }}
              interval={0}
              angle={-20}
              height={64}
              textAnchor="end"
            />
            <YAxis stroke={EIXO} tick={tick} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: REALCE, opacity: 0.3 }} />
            <Bar dataKey="total" fill={CORES[2]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </Painel>
      </div>
    </div>
  );
}
