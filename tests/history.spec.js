import { test, expect } from "@playwright/test";
import { formatEntry } from "../lib/history";

const firstId = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";
const mockUrl = "http://127.0.0.1:54329";

async function login(page, email = "lay@example.com") {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("senha-teste-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
}

test("salva com rótulos e mostra histórico ordenado, data/hora e paginação", async ({ page, request }) => {
  expect(formatEntry([{ id: "a", rotulo: "Primeiro" }, { id: "b", rotulo: "Segundo" }], { a: "Uma\nlinha", b: "Outro texto" }))
    .toBe("Primeiro:\nUma\nlinha\n\nSegundo:\nOutro texto");
  const records = Array.from({ length: 21 }, (_, index) => ({
    id: index + 1, user_id: firstId, entrada: `Registro anterior ${index + 1}`,
    resposta: `Resposta anterior ${index + 1}`, created_at: `2026-01-${String(index + 1).padStart(2, "0")}T15:00:00Z`,
  }));
  await request.post(`${mockUrl}/__test/reset`, { data: { records } });
  await login(page);
  await page.getByLabel("Cole aqui a mensagem que você recebeu").fill("Minha mensagem\ncom outra linha");
  const resultPromise = page.waitForResponse(response => response.url().endsWith("/api/ia"));
  await page.getByRole("button", { name: "Analisar mensagem", exact: true }).click();
  const response = await resultPromise;
  expect(response.status()).toBe(200);
  const analysis = await response.text();
  await expect(page.getByRole("status")).toHaveText(analysis);
  await page.getByRole("link", { name: "Meu histórico", exact: true }).click();
  await expect(page).toHaveURL(/\/historico$/);
  const cards = page.locator(".history-card");
  await expect(cards).toHaveCount(20);
  await expect(cards.first()).toContainText("Cole aqui a mensagem que você recebeu:\nMinha mensagem\ncom outra linha");
  await expect(cards.first()).toContainText(analysis);
  await expect(cards.nth(1)).toContainText("Registro anterior 21");
  await expect(cards.nth(1).locator("time")).toHaveText("21/01/2026, 12:00");
  await page.getByRole("link", { name: "Mais antigas", exact: true }).click();
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText("Registro anterior 2");
  await expect(page.getByRole("link", { name: "Mais recentes", exact: true })).toBeVisible();
});

test("isola duas contas, ignora dono enviado pelo cliente e protege /historico", async ({ page, request }) => {
  await request.post(`${mockUrl}/__test/reset`, { data: { records: [
    { id: 1, user_id: firstId, entrada: "Segredo da primeira conta", resposta: "Privado da primeira", created_at: "2026-01-01T12:00:00Z" },
    { id: 2, user_id: secondId, entrada: "Segredo da segunda conta", resposta: "Privado da segunda", created_at: "2026-01-02T12:00:00Z" },
  ] } });
  await page.goto("/historico");
  await expect(page).toHaveURL(/\/login$/);
  await login(page);
  const response = await page.request.post("/api/ia", { data: { mensagem: "Dono validado no servidor", user_id: secondId } });
  expect(response.status()).toBe(200);
  await page.goto("/historico");
  await expect(page.getByText("Segredo da primeira conta", { exact: true })).toBeVisible();
  await expect(page.locator(".history-list")).toContainText("Dono validado no servidor");
  await expect(page.getByText("Segredo da segunda conta", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, "outra@example.com");
  await page.goto("/historico");
  await expect(page.getByText("Segredo da segunda conta", { exact: true })).toBeVisible();
  await expect(page.locator(".history-list")).not.toContainText("Dono validado no servidor");
  await expect(page.getByText("Segredo da primeira conta", { exact: true })).toHaveCount(0);
});

test("trata histórico vazio e falhas de gravação/leitura sem confirmar salvamento", async ({ page, request }) => {
  await request.post(`${mockUrl}/__test/reset`, { data: {} });
  await login(page);
  await page.goto("/historico");
  await expect(page.getByRole("status")).toHaveText("Você ainda não tem análises salvas.");
  await page.getByRole("link", { name: "Nova análise", exact: true }).click();
  await request.post(`${mockUrl}/__test/reset`, { data: { failWrite: true } });
  await page.getByLabel("Cole aqui a mensagem que você recebeu").fill("Teste de falha");
  await page.getByRole("button", { name: "Analisar mensagem", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("A análise foi gerada, mas não foi possível salvar no seu histórico. Tente novamente em instantes.");
  await expect(page.getByRole("status")).toBeEmpty();
  await request.post(`${mockUrl}/__test/reset`, { data: { failRead: true } });
  await page.goto("/historico");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Não foi possível carregar seu histórico");
  await expect(page.getByText("Você ainda não tem análises salvas.", { exact: true })).toHaveCount(0);
});
