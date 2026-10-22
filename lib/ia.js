export class AnalysisError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function buildPrompt(config, values) {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    throw new AnalysisError("Envie os campos da mensagem em um objeto válido.", 400);
  }
  const fields = Object.create(null);
  for (const field of config.campos) {
    const value = values[field.id];
    if (typeof value !== "string" || !value.trim()) {
      throw new AnalysisError(`Preencha o campo “${field.rotulo}”.`, 400);
    }
    if (value.length > 20000) {
      throw new AnalysisError(`O campo “${field.rotulo}” deve ter no máximo 20.000 caracteres.`, 400);
    }
    fields[field.id] = value;
  }
  // Uma única substituição impede que {id} dentro do texto seja reinterpretado.
  return config.prompt.replace(/\{([^{}]+)\}/g, (placeholder, id) =>
    Object.hasOwn(fields, id) ? fields[id] : placeholder
  );
}

export async function analyze(config, values, apiKey, fetcher = fetch) {
  const prompt = buildPrompt(config, values);
  if (config.modoTeste) {
    return `VEREDITO: SUSPEITO

POR QUE:
- Esta é uma resposta de exemplo do modo de teste.
- Nenhuma IA foi consultada para analisar sua mensagem.

O QUE FAZER AGORA:
1. Não clique nos links nem envie dinheiro ou dados pessoais.
2. Confira a mensagem pelo contato oficial da empresa ou da pessoa.
3. Peça ajuda a alguém de confiança antes de agir.`;
  }
  if (!apiKey) {
    throw new AnalysisError("O serviço de análise ainda não foi configurado. Tente novamente mais tarde.", 503);
  }

  let response;
  try {
    response = await fetcher("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: config.modelo,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 900,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
    });
  } catch (error) {
    const timeout = error.name === "TimeoutError" || error.name === "AbortError";
    throw new AnalysisError(timeout
      ? "A análise demorou mais que o esperado. Tente novamente."
      : "Não foi possível conectar ao serviço de análise. Tente novamente em instantes.", timeout ? 504 : 502);
  }
  if (response.status === 429) throw new AnalysisError("Você atingiu o limite de uso de hoje.", 429);
  if (response.status === 401) throw new AnalysisError("Chave da IA inválida.", 401);
  if (!response.ok) throw new AnalysisError("O serviço de análise está indisponível. Tente novamente em instantes.", 502);

  let data;
  try {
    data = await response.json();
  } catch {
    throw new AnalysisError("O serviço de análise enviou uma resposta inválida. Tente novamente.", 502);
  }
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new AnalysisError("Não foi possível obter uma resposta da IA. Tente novamente.", 502);
  }
  return text;
}
