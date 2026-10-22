import { desafio } from "../../../desafio";
import { analyze, AnalysisError } from "../../../lib/ia";
import { createClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function textResponse(text, status = 200) {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}

export async function POST(request) {
  try {
    const supabase = await createClient();
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
    return textResponse(await analyze(desafio, values, process.env.OPENROUTER_API_KEY));
  } catch (error) {
    if (error instanceof AnalysisError) return textResponse(error.message, error.status);
    return textResponse("Não foi possível analisar a mensagem. Tente novamente em instantes.", 500);
  }
}
