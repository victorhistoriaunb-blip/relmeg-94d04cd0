# RelMeg como plataforma de BI

Prioridade: números confiáveis e auditáveis em todo o app. Tudo será feito aproveitando o que já existe (importação, várias planilhas, dashboards, filtros, destaques, relatórios), sem quebrar dashboards nem bases já salvas.

## Fase 1 — Integridade dos dados (primeiro)
- Importação: ler a planilha inteira, gravar em lotes e, ao final, conferir que a quantidade salva bate com a quantidade lida. Se não bater, avisar e não deixar a base pela metade.
- Relatório de importação: linhas lidas, linhas salvas, linhas vazias ignoradas e colunas detectadas.
- Todos os KPIs, gráficos, mapas e tabelas calculados sobre a base completa (sem amostras). O "limite de itens" de um gráfico passa a mostrar as N maiores categorias mais uma fatia "Outros" com o restante, para o total nunca mudar.
- Selo em cada componente: "3.427 registros analisados" (ou "842 de 3.427" quando filtrado).
- Desempenho: cálculos memorizados e tabelas paginadas/virtualizadas para funcionar com dezenas de milhares de linhas.

## Fase 2 — Perfil automático do dataset
Painel "Perfil da base" logo após importar e na página Dados:
- total de registros e de colunas, tipo de cada campo;
- preenchidos, vazios, valores únicos e linhas duplicadas;
- distribuição por categoria, por período (dia/mês/ano) e geográfica;
- detecção automática de campos de data, local (UF, município, cidade, região, país, latitude/longitude) e numéricos.
- Sugestões de visualização com um clique ("Quantidade por Estado", "Evolução mensal"...).

## Fase 3 — Exploração até a origem (drill-down)
- Clicar em um KPI, barra, fatia, ponto ou região abre uma tabela com exatamente os registros que formam aquele número, com o total no topo, busca, paginação e exportação CSV.
- Opção "aplicar como filtro" a partir do clique.

## Fase 4 — Filtros globais
- Barra de filtros que afeta KPIs, gráficos, mapas e tabelas juntos: período (de/até) para campos de data, seleção múltipla por categoria (estado, município, fonte, cliente, assunto...), palavra-chave em todas as colunas.
- Chips de filtros ativos com remoção individual; contagem filtrada sempre visível.

## Fase 5 — Mapas
- Mapa do Brasil por estado (pintado pela quantidade ou soma), com clique na UF para filtrar/abrir registros.
- Mapa de pontos e de concentração quando houver latitude/longitude.
- Municípios/cidades: exibidos como pontos quando houver coordenadas; sem coordenadas, agrupados em ranking por município (geocodificação automática de nomes fica fora desta etapa).

## Fase 6 — Layout livre (arrastar e redimensionar)
- Grade de dashboard no estilo BI: arrastar gráficos, KPIs, tabelas e mapas; redimensionar largura/altura; layout salvo na nuvem por dashboard.
- Novos tipos de componente: KPI (contagem, soma, média, únicos, vazios), tabela, mapa, texto.
- No celular, os componentes se empilham em uma coluna automaticamente.

## Fase 7 — Biblioteca de modelos
Modelos que montam um dashboard completo a partir dos campos detectados: Executivo, KPIs, Monitoramento, Financeiro, Temporal, Geográfico, Categorias, Comparação, Tendências, Tabela + gráficos, Mídia/monitoramento e Grande volume. Cada modelo usa só os componentes possíveis com os dados disponíveis e pode ser editado depois.

## Detalhes técnicos
- Nova tabela `dashboards` (nome, layout JSON, modelo) com RLS por `auth.uid()`; `dashboard_widgets` ganha colunas aditivas `dashboard_id`, `kind` (chart/kpi/table/map/text), `layout` (x, y, w, h) e `config` JSON. Widgets atuais migram para um dashboard "Principal" — nada é perdido.
- Motor de agregação único (`lib/relmeg/engine.ts`): filtros → agrupamento → "Outros", reaproveitado por gráficos, KPIs, mapas, drill-down, relatórios PDF/PPTX e aba Análise (que passa a enviar contagens exatas).
- Grade com `react-grid-layout`; mapas com SVG do Brasil por UF (sem chaves externas) e `leaflet` carregado só no navegador para coordenadas.
- Inserção em lotes com verificação de contagem via `count: "exact"`.
- Validação com planilhas de teste de 1.000, 3.427 e 10.000 linhas conferindo os totais em KPIs, gráficos, mapa e drill-down; depois os dados de teste são removidos.

Dado o tamanho, a entrega será feita em etapas na ordem acima, cada uma testada antes da próxima.
