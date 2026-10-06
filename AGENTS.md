<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Várias planilhas por usuário: a visão "todas" une colunas pelo nome (coluna virtual "Planilha"); widgets dessa visão usam combined=true — permite cruzamento sem alterar dados originais.
- Todos os números (KPIs, gráficos, mapas, drill-down, relatórios) saem de src/lib/relmeg/engine.ts sobre o dataset completo; limites de itens viram "Outros" — garante totais auditáveis.
- Importação grava em lotes e confere a contagem salva; se divergir, apaga a base — evita bases pela metade.
- O mapa do Brasil usa traçado próprio simplificado em src/assets/brasil-uf.json com projeção Mercator calculada no app — sem biblioteca de mapas nem chamadas a serviços de tiles, para funcionar no runtime de borda e sem rede.
