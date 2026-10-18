// Simula apenas o contrato HTTP do Auth. Não cria contas nem envia e-mails reais.
import { createServer } from "node:http";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "lay@example.com",
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })}.test-signature`;
const session = { access_token: token, refresh_token: "test-refresh-token", expires_in: 3600, token_type: "bearer", user };

createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  response.setHeader("X-Supabase-Api-Version", "2024-01-01");
  let raw = "";
  for await (const chunk of request) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  const url = new URL(request.url, "http://127.0.0.1:54329");
  const send = (status, data) => {
    response.writeHead(status);
    response.end(JSON.stringify(data));
  };
  if (url.pathname === "/health") return send(200, { ok: true });
  if (url.pathname === "/auth/v1/token") {
    if (url.searchParams.get("grant_type") === "pkce" && body.auth_code === "valid-test-code" && body.code_verifier) return send(200, session);
    if (url.searchParams.get("grant_type") === "refresh_token" && body.refresh_token === "test-refresh-token") return send(200, session);
    if (body.email === user.email && body.password === "senha-teste-123") return send(200, session);
    return send(400, { code: "invalid_credentials", msg: "Invalid login credentials" });
  }
  if (url.pathname === "/auth/v1/signup") {
    if (body.email === "limite@example.com") return send(429, { code: "over_email_send_rate_limit", msg: "Email rate limit exceeded" });
    if (body.email === "imediato@example.com") return send(200, session);
    return send(200, { user: { ...user, email: body.email }, session: null });
  }
  if (url.pathname === "/auth/v1/user") {
    if (request.headers.authorization === `Bearer ${token}`) return send(200, user);
    return send(401, { code: "bad_jwt", msg: "Invalid JWT" });
  }
  if (url.pathname === "/auth/v1/logout") return send(204, null);
  return send(400, { code: "bad_code_verifier", msg: "Invalid authorization code" });
}).listen(54329, "127.0.0.1");
