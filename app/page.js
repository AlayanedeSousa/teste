"use client";

import { useState } from "react";
import { content } from "./content";

export default function Home() {
  const [text, setText] = useState("");
  const [response, setResponse] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setResponse(text);
  }

  return (
    <main className="page">
      <header className="intro">
        <h1>{content.title}</h1>
        <p>{content.description}</p>
      </header>

      <form className="text-form" onSubmit={handleSubmit}>
        <label htmlFor="text">{content.inputLabel}</label>
        <textarea
          id="text"
          name="text"
          rows={6}
          placeholder={content.placeholder}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit">{content.button}</button>
      </form>

      <section className="response-section" aria-labelledby="response-title">
        <h2 id="response-title">{content.responseTitle}</h2>
        <div className="response" role="status" aria-live="polite" aria-atomic="true">
          {response}
        </div>
      </section>
    </main>
  );
}
