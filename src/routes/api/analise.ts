import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } from "@/lib/ai/run-id.server";

const Body = z.object({
  pergunta: z.string().max(2000),
  contexto: z.string().max(400_000),
});

async function usuarioValido(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!token || !url || !key) return false;
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
  return r.ok;
}

const SISTEMA = `Você é um analista sênior de Relações Governamentais e inteligência de dados.
Recebe dados tabulares de uma ou mais planilhas (cada linha traz a coluna "Planilha" com a origem e um identificador #N).
Escreva em português do Brasil, em Markdown, com as seções:
## Resumo executivo
## Principais achados
## Cruzamentos entre planilhas (se houver mais de uma)
## Conclusões e recomendações
## Referências
Regras: baseie-se SOMENTE nos dados fornecidos; cite a origem de cada afirmação no formato [Planilha: NOME, #N] ou [Planilha: NOME, coluna X]; quando usar estatísticas agregadas, cite a planilha e a coluna; nunca invente números; deixe claro quando os dados forem insuficientes. Não use tabelas Markdown; use listas. Seja objetivo, no máximo ~900 palavras.`;

export const Route = createFileRoute("/api/analise")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await usuarioValido(request))) return new Response("Não autorizado", { status: 401 });
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Requisição inválida", { status: 400 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("IA não configurada", { status: 500 });
        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });
        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          system: SISTEMA,
          messages: [{ role: "user", content: `Pedido do usuário: ${parsed.data.pergunta || "Faça uma análise geral dos dados."}\n\nDADOS:\n${parsed.data.contexto}` }],
          abortSignal: request.signal,
          providerOptions: { openai: { forceReasoning: true, reasoningEffort: "medium", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
          onError: ({ error }) => console.error("analise", error),
        });
        return withLovableAiGatewayRunIdHeader(result.toTextStreamResponse(), runIdFetch);
      },
    },
  },
});
