import { test, expect } from "@playwright/test";
import { desafio } from "../desafio";
import { analyze, buildPrompt } from "../lib/ia";

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("lay@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha-teste-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
}

test("interpola todos os campos sem reinterpretar o conteúdo digitado", () => {
  const config = { campos: [{ id: "a", rotulo: "A" }, { id: "b", rotulo: "B" }], prompt: "{a}\n{b}\n{a}" };
  expect(buildPrompt(config, { a: "$& {b}", b: "Texto\ncom linhas" }))
    .toBe("$& {b}\nTexto\ncom linhas\n$& {b}");
});

test("modo de teste não acessa a IA nem exige chave", async () => {
  let requests = 0;
  const text = await analyze(desafio, { mensagem: "Mensagem de teste" }, undefined, () => { requests++; });
  expect(requests).toBe(0);
  expect(text).toContain("modo de teste");
  expect(text).toContain("VEREDITO: SUSPEITO");
});

test("modo real usa o modelo configurado, o prompt e max_tokens 900", async () => {
  const text = await analyze({ ...desafio, modoTeste: false }, { mensagem: "Pedido de Pix", modelo: "modelo-injetado" }, "test-api-key", async (url, options) => {
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(options.headers.Authorization).toBe("Bearer test-api-key");
    const body = JSON.parse(options.body);
    expect(body.model).toBe("openrouter/free");
    expect(body.max_tokens).toBe(900);
    expect(body.messages[0].content).toContain("MENSAGEM: Pedido de Pix");
    expect(body.messages[0].content).not.toContain("{mensagem}");
    return Response.json({ choices: [{ message: { content: "VEREDITO: SUSPEITO\nPOR QUE: Exemplo." } }] });
  });
  expect(text).toBe("VEREDITO: SUSPEITO\nPOR QUE: Exemplo.");
});

test("modo real traduz erros do provedor e falhas de conexão", async () => {
  const config = { ...desafio, modoTeste: false };
  for (const [status, message] of [[429, "Você atingiu o limite de uso de hoje."], [401, "Chave da IA inválida."], [500, "O serviço de análise está indisponível. Tente novamente em instantes."]]) {
    await expect(analyze(config, { mensagem: "Teste" }, "test-key", async () => new Response("internal provider error", { status })))
      .rejects.toMatchObject({ status: status === 500 ? 502 : status, message });
  }
  await expect(analyze(config, { mensagem: "Teste" }, undefined)).rejects.toMatchObject({ status: 503 });
  await expect(analyze(config, { mensagem: "Teste" }, "test-key", async () => { throw new TypeError("fetch failed"); }))
    .rejects.toMatchObject({ status: 502 });
  await expect(analyze(config, { mensagem: "Teste" }, "test-key", async () => Response.json({ choices: [] })))
    .rejects.toMatchObject({ status: 502 });
});

test("API rejeita acesso sem sessão", async ({ request }) => {
  const response = await request.post("/api/ia", { data: { mensagem: "Teste" } });
  expect(response.status()).toBe(403);
  expect(await response.text()).toContain("Entre novamente");
});

test("tela usa o desafio, API valida os campos e devolve apenas texto", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(desafio.nome);
  await expect(page.getByText(desafio.subtitulo, { exact: true })).toBeVisible();
  await expect(page.getByText(desafio.aviso, { exact: true })).toBeVisible();
  await expect(page.getByLabel(desafio.campos[0].rotulo)).toHaveAttribute("rows", "6");
  const invalid = await page.request.post("/api/ia", { data: { mensagem: " " } });
  expect(invalid.status()).toBe(400);
  const malformed = await page.request.post("/api/ia", { data: "{", headers: { "Content-Type": "application/json" } });
  expect(malformed.status()).toBe(400);
  const oversized = await page.request.post("/api/ia", { data: { mensagem: "x".repeat(20001) } });
  expect(oversized.status()).toBe(400);
  const result = await page.request.post("/api/ia", { data: { mensagem: "Confirme seu Pix" } });
  expect(result.status()).toBe(200);
  expect(result.headers()["content-type"]).toContain("text/plain");
  expect(result.headers()["cache-control"]).toContain("no-store");
  expect(await result.text()).toContain("VEREDITO: SUSPEITO");
});

test("desabilita o botão enquanto aguarda e preserva quebras de linha com segurança", async ({ page }) => {
  await login(page);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let requested;
  const started = new Promise(resolve => { requested = resolve; });
  await page.route("**/api/ia", async route => {
    expect(route.request().postDataJSON()).toEqual({ mensagem: "Mensagem recebida" });
    requested();
    await gate;
    await route.fulfill({ status: 200, contentType: "text/plain", body: "VEREDITO: SUSPEITO\n<img src=x onerror=alert(1)>" });
  });
  await page.getByLabel(desafio.campos[0].rotulo).fill("Mensagem recebida");
  await page.getByRole("button", { name: desafio.botao, exact: true }).click();
  await started;
  await expect(page.getByRole("button", { name: "Analisando...", exact: true })).toBeDisabled();
  release();
  await expect(page.getByRole("status")).toHaveText("VEREDITO: SUSPEITO\n<img src=x onerror=alert(1)>");
  expect(await page.getByRole("status").evaluate(element => getComputedStyle(element).whiteSpace)).toBe("pre-wrap");
  await expect(page.getByRole("status").locator("img")).toHaveCount(0);
  await expect(page.getByRole("button", { name: desafio.botao, exact: true })).toBeEnabled();
});

test("apresenta erros 429, 401 e erro inesperado em português", async ({ page }) => {
  await login(page);
  await page.getByLabel(desafio.campos[0].rotulo).fill("Mensagem recebida");
  for (const [status, message] of [[429, "Você atingiu o limite de uso de hoje."], [401, "Chave da IA inválida."], [500, "Não foi possível analisar a mensagem. Tente novamente."]]) {
    await page.route("**/api/ia", route => route.fulfill({ status, contentType: "text/html", body: "<html>Internal error</html>" }));
    await page.getByRole("button", { name: desafio.botao, exact: true }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(message);
    await expect(page.getByRole("button", { name: desafio.botao, exact: true })).toBeEnabled();
    await page.unroute("**/api/ia");
  }
});
