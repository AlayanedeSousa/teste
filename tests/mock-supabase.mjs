// Simula Auth e REST para os testes locais. Não acessa o Supabase real.
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
const secondUser = { ...user, id: "22222222-2222-4222-8222-222222222222", email: "outra@example.com" };
const secondToken = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: secondUser.id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })}.second-test-signature`;
const secondSession = { ...session, user: secondUser, access_token: secondToken, refresh_token: "second-test-refresh-token" };
let records = [];
let nextId = 1;
let failRead = false;
let failWrite = false;

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
  if (url.pathname === "/__test/reset") {
    records = body.records || [];
    nextId = records.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
    failRead = !!body.failRead;
    failWrite = !!body.failWrite;
    return send(200, { ok: true });
  }
  const currentUser = request.headers.authorization === `Bearer ${token}` ? user
    : request.headers.authorization === `Bearer ${secondToken}` ? secondUser : null;
  if (url.pathname === "/rest/v1/respostas") {
    if (!currentUser) return send(403, { code: "42501", message: "Permission denied" });
    if (request.method === "POST") {
      if (failWrite) return send(503, { message: "Simulated write failure" });
      const owner = Object.hasOwn(body, "user_id") ? body.user_id : currentUser.id;
      if (owner !== currentUser.id) return send(403, { code: "42501", message: "Row security violation" });
      records.push({ ...body, user_id: owner, id: nextId++, created_at: new Date().toISOString() });
      return send(201, null);
    }
    if (failRead) return send(503, { message: "Simulated read failure" });
    const requestedUser = url.searchParams.get("user_id")?.replace(/^eq\./, "");
    const selected = records.filter(row => row.user_id === currentUser.id && (!requestedUser || row.user_id === requestedUser));
    const descending = url.searchParams.get("order")?.startsWith("created_at.desc");
    selected.sort((a, b) => descending ? Date.parse(b.created_at) - Date.parse(a.created_at) || b.id - a.id : 0);
    const offset = Number(url.searchParams.get("offset") || 0);
    const limit = Number(url.searchParams.get("limit") || selected.length);
    const page = selected.slice(offset, offset + limit);
    response.setHeader("Content-Range", `${offset}-${offset + page.length - 1}/${selected.length}`);
    return send(200, page);
  }
  if (url.pathname === "/auth/v1/token") {
    if (url.searchParams.get("grant_type") === "pkce" && body.auth_code === "valid-test-code" && body.code_verifier) return send(200, session);
    if (url.searchParams.get("grant_type") === "refresh_token" && body.refresh_token === "test-refresh-token") return send(200, session);
    if (url.searchParams.get("grant_type") === "refresh_token" && body.refresh_token === "second-test-refresh-token") return send(200, secondSession);
    if (body.email === user.email && body.password === "senha-teste-123") return send(200, session);
    if (body.email === secondUser.email && body.password === "senha-teste-123") return send(200, secondSession);
    return send(400, { code: "invalid_credentials", msg: "Invalid login credentials" });
  }
  if (url.pathname === "/auth/v1/signup") {
    if (body.email === "limite@example.com") return send(429, { code: "over_email_send_rate_limit", msg: "Email rate limit exceeded" });
    if (body.email === "imediato@example.com") return send(200, session);
    return send(200, { user: { ...user, email: body.email }, session: null });
  }
  if (url.pathname === "/auth/v1/user") {
    if (currentUser) return send(200, currentUser);
    return send(401, { code: "bad_jwt", msg: "Invalid JWT" });
  }
  if (url.pathname === "/auth/v1/logout") return send(204, null);
  return send(400, { code: "bad_code_verifier", msg: "Invalid authorization code" });
}).listen(54329, "127.0.0.1");
