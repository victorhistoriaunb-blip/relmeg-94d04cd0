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
import { useRelmeg } from "@/lib/relmeg/store";
import { setoresDe, type Parlamentar } from "@/lib/relmeg/types";

export const Route = createFileRoute("/dashboards")({
  head: () => ({
    meta: [
      { title: "Dashboards Analíticos — RelMeg" },
      {
        name: "description",
        content: "Distribuição de parlamentares por UF, partido, cargo, setor e termômetro em gráficos interativos.",
      },
      { property: "og:title", content: "Dashboards Analíticos — RelMeg" },
      { property: "og:description", content: "Visualize sua base parlamentar em indicadores e gráficos dinâmicos." },
    ],
  }),
  component: Dashboards,
});

const CORES = [
  "oklch(0.78 0.13 190)",
  "oklch(0.68 0.14 250)",
  "oklch(0.75 0.15 85)",
  "oklch(0.7 0.16 330)",
  "oklch(0.72 0.15 145)",
];

function contar(values: string[], limite = 0) {
  const counts = new Map<string, number>();
  values.map((v) => v.trim()).filter(Boolean).forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  const list = [...counts.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
  return limite ? list.slice(0, limite) : list;
}

const EIXO = "oklch(0.7 0.019 254)";
const REALCE = "oklch(0.32 0.032 250)";

const tooltipStyle = {
  backgroundColor: "oklch(0.235 0.021 259)",
  border: "1px solid oklch(0.32 0.022 258)",
  borderRadius: 8,
  color: "oklch(0.96 0.005 250)",
  fontSize: 12,
};

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
    <div className="panel rise-in rounded-lg p-5">
      <h2 className="font-display text-base font-semibold">{titulo}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{descricao}</p>
      <ResponsiveContainer width="100%" height={altura}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function Dashboards() {
  const { data, filters } = useRelmeg();
  const filtrados: Parlamentar[] = aplicarFiltros(data, filters);

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
  const porTermometro = contar(filtrados.map((p) => p.termometro));

  return (
    <div className="space-y-6">
      <Titulo />
      <KpiCards data={filtrados} />
      <FilterBar data={data} />

      <div className="grid gap-4 xl:grid-cols-2">
        <Painel titulo="Parlamentares por UF" descricao="Top 15 unidades federativas" altura={360}>
          <BarChart data={porUf} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis type="category" dataKey="name" width={48} stroke="var(--muted-foreground)" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
            <Bar dataKey="total" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </Painel>

        <Painel titulo="Parlamentares por Partido" descricao="Top 8 partidos" altura={360}>
          <PieChart>
            <Pie data={porPartido} dataKey="total" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
              {porPartido.map((entry, i) => (
                <Cell key={entry.name} fill={CORES[i % CORES.length]} stroke="var(--card)" />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </Painel>

        <Painel titulo="Parlamentares por Cargo" descricao="Composição da base por função">
          <BarChart data={porCargo}>
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
            <Bar dataKey="total" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </Painel>

        <Painel titulo="Parlamentares por Setor" descricao="Top 10 setores de interesse">
          <BarChart data={porSetor}>
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} interval={0} angle={-20} height={56} textAnchor="end" />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
            <Bar dataKey="total" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </Painel>

        <Painel titulo="Parlamentares por Termômetro" descricao="Comparativo de posicionamento" altura={300}>
          <BarChart data={porTermometro}>
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {porTermometro.map((entry, i) => (
                <Cell key={entry.name} fill={CORES[i % CORES.length]} />
              ))}
            </Bar>
          </BarChart>
        </Painel>
      </div>
    </div>
  );
}

function Titulo() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Dashboards</h1>
      <p className="text-sm text-muted-foreground">
        Análises geradas automaticamente a partir da base importada.
      </p>
    </div>
  );
}