import { test, expect } from "@playwright/test";

async function fillCredentials(page, email, password) {
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
}

test("protege a página principal e não aceita cookie inventado", async ({ page, context }) => {
  await context.addCookies([{ name: "sb-127-auth-token", value: "sessao-inventada", domain: "127.0.0.1", path: "/" }]);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Analisar", exact: true })).toHaveCount(0);
});

test("valida campos e traduz credenciais inválidas", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Digite um endereço de e-mail válido.");
  await fillCredentials(page, "lay@example.com", "");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Digite sua senha.");
  await fillCredentials(page, "lay@example.com", "errada");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("E-mail ou senha incorretos.");
});

test("entra, mantém sessão no recarregamento, analisa e sai", async ({ page }) => {
  await page.goto("/login");
  await fillCredentials(page, "lay@example.com", "senha-teste-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await expect(page.getByText("lay@example.com", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Sair", exact: true })).toBeVisible();
  await page.getByLabel("Seu texto", { exact: true }).fill("Olá!\nMeu texto.");
  await page.getByRole("button", { name: "Analisar", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Olá!\nMeu texto.");
  await page.goto("/login");
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("cadastro valida senha e orienta a confirmação de e-mail", async ({ page }) => {
  await page.goto("/login");
  await fillCredentials(page, "nova@example.com", "123");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("A senha deve ter pelo menos 6 caracteres.");
  await fillCredentials(page, "nova@example.com", "senha-teste-123");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Confira seu e-mail");
  await expect(page).toHaveURL(/\/login$/);
});

test("traduz limite de cadastro e permite cadastro com sessão imediata", async ({ page }) => {
  await page.goto("/login");
  await fillCredentials(page, "limite@example.com", "senha-teste-123");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Muitos e-mails foram solicitados");
  await fillCredentials(page, "imediato@example.com", "senha-teste-123");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
});

test("callback rejeita código ausente e conclui confirmação PKCE", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Não foi possível confirmar seu e-mail");
  await fillCredentials(page, "nova@example.com", "senha-teste-123");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Confira seu e-mail");
  await page.goto("/auth/callback?code=valid-test-code");
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await expect(page.getByRole("button", { name: "Sair", exact: true })).toBeVisible();
});

test("login cabe em tela pequena", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Criar conta", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
