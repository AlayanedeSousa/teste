"use client";

import { useState } from "react";
import { desafio } from "../../desafio";

export default function TextAnalyzer() {
  const [values, setValues] = useState(() => Object.fromEntries(desafio.campos.map(field => [field.id, ""])));
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    setResponse("");
    try {
      const result = await fetch("/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (result.status === 429) throw new Error("Você atingiu o limite de uso de hoje.");
      if (result.status === 401) throw new Error("Chave da IA inválida.");
      const text = await result.text();
      if (!result.ok) {
        const plainText = result.headers.get("content-type")?.startsWith("text/plain");
        throw new Error(plainText && text ? text : "Não foi possível analisar a mensagem. Tente novamente.");
      }
      if (!text.trim()) throw new Error("A análise não retornou uma resposta. Tente novamente.");
      setResponse(text);
    } catch (error) {
      setError(error instanceof TypeError
        ? "Não foi possível enviar a mensagem. Verifique sua conexão e tente novamente."
        : error.message || "Não foi possível analisar a mensagem. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <header className="intro">
        <h1>{desafio.nome}</h1>
        <p>{desafio.subtitulo}</p>
      </header>

      <form className="text-form" onSubmit={handleSubmit} aria-busy={pending} noValidate>
        {desafio.campos.map(field => (
          <div className="analysis-field" key={field.id}>
            <label htmlFor={field.id}>{field.rotulo}</label>
            <textarea
              id={field.id}
              name={field.id}
              rows={field.linhas}
              value={values[field.id] || ""}
              onChange={event => setValues(current => ({ ...current, [field.id]: event.target.value }))}
              required
              maxLength={20000}
            />
          </div>
        ))}
        <button type="submit" disabled={pending}>{pending ? "Analisando..." : desafio.botao}</button>
        <p className="form-hint">{desafio.aviso}</p>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>

      <section className="response-section" aria-labelledby="response-title">
        <h2 id="response-title">Resposta</h2>
        <div className="response" role="status" aria-live="polite" aria-atomic="true">
          {response}
        </div>
      </section>
    </>
  );
}
