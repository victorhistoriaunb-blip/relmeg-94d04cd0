# RelMeg como criador universal de dashboards

## Objetivo
Transformar o RelMeg em uma plataforma agnóstica a colunas: qualquer CSV/XLSX poderá ser importado, explorado, filtrado e usado para criar dashboards sem exigir campos parlamentares. A identidade visual, autenticação e navegação atuais serão preservadas e adaptadas ao novo propósito.

## O que será construído

### 1. Modelo universal e persistência por conta
- Criar uma estrutura de dados em nuvem para bases, registros genéricos e dashboards configurados.
- Salvar o cabeçalho original, a ordem das colunas, o tipo inferido de cada campo e cada linha como dados flexíveis.
- Vincular bases, registros e dashboards ao usuário autenticado, com regras de acesso isoladas por conta e sincronização entre dispositivos.
- Manter a tabela parlamentar existente apenas como legado, sem torná-la requisito para novas importações.

### 2. Importação agnóstica de CSV/XLSX
- Ler a primeira aba de qualquer Excel e qualquer CSV sem validar nomes obrigatórios.
- Preservar nomes e ordem das colunas, normalizando apenas duplicidades ou cabeçalhos vazios sem alterar o conteúdo exibido.
- Inferir automaticamente texto, número, percentual, moeda, data e booleano a partir dos valores.
- Exibir uma conferência responsiva com colunas detectadas, tipos inferidos e amostra das linhas antes da confirmação.
- Permitir nomear a base e substituir sua versão ativa de forma explícita.

### 3. Exploração universal dos registros
- Adaptar a área hoje chamada Perfis para uma visão genérica de Dados.
- Gerar pesquisa global e filtros dinamicamente a partir das colunas da base ativa.
- Exibir tabela responsiva em desktop e cartões legíveis em telas menores, sem rolagem horizontal da página.
- Permitir criar, editar e excluir registros com formulário gerado pelas colunas; alterações continuarão com salvamento automático.

### 4. Construtor universal de dashboards
- Substituir gráficos fixos por dashboards configuráveis.
- Permitir escolher título, descrição, tipo de gráfico, coluna de categoria, coluna de valor, agregação e limite de itens.
- Oferecer agregações adequadas ao tipo inferido: contagem para qualquer coluna e soma/média/mínimo/máximo para campos numéricos.
- Permitir criar, editar, excluir e reorganizar dashboards.
- Aplicar os filtros ativos da base aos indicadores e gráficos.

### 5. Destaques controlados pelo usuário
- Adicionar uma alternância “Destacar” em cada dashboard.
- Criar uma seção de Destaques que mostra somente os dashboards marcados, respeitando a ordem definida pelo usuário.
- Permitir ligar/desligar o destaque diretamente no dashboard e também na área de configurações.

### 6. Exportação e estudos
- Adaptar o gerador de PDF e PowerPoint para colunas, filtros, indicadores e gráficos escolhidos da base ativa.
- Manter a logo no topo e o PowerPoint editável.
- Remover textos e opções presos ao domínio parlamentar.

### 7. Contraste, acessibilidade e responsividade
- Criar um tooltip próprio para os gráficos, com fundo opaco, texto claro e contraste consistente.
- Revisar textos secundários, badges, campos, tabelas, estados de foco e gráficos para contraste adequado.
- Ajustar cabeçalhos, filtros, formulários, modais, tabelas e gráficos para celular, tablet e desktop.
- Garantir alvos de toque confortáveis, quebra de texto, alturas estáveis de gráficos e ausência de rolagem horizontal na página.
- Respeitar preferência de redução de movimento.

### 8. Conteúdo e assinatura
- Atualizar textos da interface, ajuda e metadados para o novo posicionamento universal.
- Inserir “Criado por Victor Souza” de forma discreta no rodapé de Configurações.

## Detalhes técnicos
- Novas tabelas públicas terão `GRANT`, RLS e políticas por `auth.uid()` na mesma migração.
- Os registros usarão JSON estruturado para aceitar colunas futuras sem novas migrações.
- As definições dos dashboards serão persistidas na nuvem, não apenas no navegador.
- A migração será aditiva para não quebrar a versão atualmente publicada durante a atualização.
- A validação final cobrirá importação livre, persistência, criação e destaque de gráficos, edição de registros e visualização em larguras de celular, tablet e desktop.
