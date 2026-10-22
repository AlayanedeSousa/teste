import { desafio } from "../../../desafio";
import { analyze, AnalysisError } from "../../../lib/ia";
import { createClient } from "../../../lib/supabase/server";
import { formatEntry } from "../../../lib/history";

export const runtime = "nodejs";
export const maxDuration = 60;

function textResponse(text, status = 200) {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}

export async function POST(request) {
  let supabase;
  try {
    supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return textResponse("Sua sessão expirou. Entre novamente para analisar uma mensagem.", 403);
  } catch {
    return textResponse("Não foi possível verificar sua sessão. Entre novamente e tente outra vez.", 503);
  }

  let values;
  try {
    values = await request.json();
  } catch {
    return textResponse("Não foi possível ler os campos enviados. Envie os dados em JSON válido.", 400);
  }
  try {
    const resposta = await analyze(desafio, values, process.env.OPENROUTER_API_KEY);
    try {
      const { error } = await supabase.from("respostas").insert({
        // O default auth.uid() no banco preenche user_id usando esta sessão.
        entrada: formatEntry(desafio.campos, values),
        resposta,
      });
      if (error) throw error;
    } catch {
      return textResponse("A análise foi gerada, mas não foi possível salvar no seu histórico. Tente novamente em instantes.", 503);
    }
    return textResponse(resposta);
  } catch (error) {
    if (error instanceof AnalysisError) return textResponse(error.message, error.status);
    return textResponse("Não foi possível analisar a mensagem. Tente novamente em instantes.", 500);
  }
}
