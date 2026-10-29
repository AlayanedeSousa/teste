"use client";

import { useState } from "react";
import { desafio } from "../../desafio";
import Icon from "./ui-icon";

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
      <header className="intro analysis-intro">
        <div className="intro-copy">
          <h1>{desafio.nome}</h1>
          <p>{desafio.subtitulo}</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="hero-orbit" />
          <span className="hero-shield"><Icon name="shield" /></span>
          <span className="hero-bubble"><Icon name="message" /></span>
          <span className="hero-sparkle"><Icon name="sparkle" /></span>
        </div>
      </header>

      <div className="analysis-grid">
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
          <button type="submit" disabled={pending}>
            {pending ? <span className="spinner" aria-hidden="true" /> : <Icon name="sparkle" />}
            {pending ? "Analisando..." : desafio.botao}
            {!pending && <Icon name="arrow" />}
          </button>
          <p className="form-hint">{desafio.aviso}</p>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>

        <section className="response-section" aria-labelledby="response-title" aria-busy={pending}>
          <h2 id="response-title"><span className="section-icon"><Icon name="message" /></span>Resposta</h2>
          {pending && <div className="response-progress" aria-hidden="true"><span /><span /><span /></div>}
          <div className="response-body">
            <div className="response" role="status" aria-live="polite" aria-atomic="true">
              {response}
            </div>
            {!response && !pending && (
              <div className="response-placeholder" aria-hidden="true">
                <span className="placeholder-icon"><Icon name="message" /></span>
                <span className="placeholder-lines"><span /><span /><span /></span>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
