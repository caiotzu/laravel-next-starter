/**
 * Backend SIMULADO para os testes E2E (no lugar do Laravel). Sem dependências e sem banco: responde
 * de forma determinística aos fluxos de autenticação e devolve uma resposta genérica para o resto.
 *
 * Usuários de teste (senha de todos: Senha123@):
 *   admin@exemplo.com       -> login normal (sem 2FA), contexto Admin
 *   cliente@exemplo.com     -> login normal (sem 2FA), contexto Private
 *   admin2fa@exemplo.com    -> exige 2FA (código válido: 123456), contexto Admin
 *   cliente2fa@exemplo.com  -> exige 2FA (código válido: 123456), contexto Private
 *
 * GET /__requests devolve as requisições recebidas (para os testes conferirem o que o BFF enviou);
 * DELETE /__requests zera o registro.
 */
import { createServer } from "node:http";

const PORTA = Number(process.env.MOCK_BACKEND_PORT ?? 4010);
const SENHA = "Senha123@";
const CODIGO_2FA = "123456";
const TEMP_TOKEN = "11111111-2222-4333-8444-555555555555";

const usuarios = {
  "admin@exemplo.com": { contexto: "admin", doisFatores: false },
  "cliente@exemplo.com": { contexto: "private", doisFatores: false },
  "admin2fa@exemplo.com": { contexto: "admin", doisFatores: true },
  "cliente2fa@exemplo.com": { contexto: "private", doisFatores: true },
};

/** JWT sem assinatura válida: o frontend só decodifica o `exp`; o backend real é quem valida. */
function jwt(email) {
  const base64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${base64({ alg: "HS256", typ: "JWT" })}.${base64({ sub: email, exp: Math.floor(Date.now() / 1000) + 3600 })}.assinatura-de-teste`;
}

const requisicoes = [];

function responder(res, status, corpo) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(corpo));
}

function lerCorpo(req) {
  return new Promise((resolve) => {
    let texto = "";
    req.on("data", (pedaco) => (texto += pedaco));
    req.on("end", () => {
      try {
        resolve(texto ? JSON.parse(texto) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORTA}`);

  if (url.pathname === "/__requests") {
    if (req.method === "DELETE") {
      requisicoes.length = 0;
      return responder(res, 200, { ok: true });
    }
    return responder(res, 200, requisicoes);
  }

  const corpo = await lerCorpo(req);
  requisicoes.push({ metodo: req.method, caminho: url.pathname, corpo, autorizacao: req.headers.authorization ?? null });

  // Rotas do backend real ficam sob /api; aqui aceitamos com ou sem o prefixo.
  const caminho = url.pathname.replace(/^\/api/, "");
  const admin = caminho.startsWith("/admin");
  const rota = admin ? caminho.slice("/admin".length) : caminho;

  if (req.method === "POST" && rota === "/login") {
    const usuario = usuarios[corpo.email];
    const contextoCerto = usuario && (usuario.contexto === "admin") === admin;

    if (!contextoCerto || corpo.senha !== SENHA) {
      return responder(res, 401, { errors: { business: ["Credenciais inválidas."] } });
    }
    if (usuario.doisFatores) {
      return responder(res, 200, { data: { "2fa_enable": true, temp_token: TEMP_TOKEN } });
    }
    return responder(res, 200, {
      data: { "2fa_enable": false, token: jwt(corpo.email), token_type: "bearer", expires_in: 3600 },
    });
  }

  if (req.method === "POST" && rota === "/2fa/verificar") {
    if (corpo.temp_token !== TEMP_TOKEN || corpo.codigo !== CODIGO_2FA) {
      return responder(res, 422, { errors: { business: ["Código de verificação inválido."] } });
    }
    const email = admin ? "admin2fa@exemplo.com" : "cliente2fa@exemplo.com";
    return responder(res, 200, { data: { token: jwt(email), token_type: "bearer", expires_in: 3600 } });
  }

  if (req.method === "POST" && (rota === "/logout" || rota === "/refresh")) {
    return responder(res, 200, { data: { message: "ok" } });
  }

  // Qualquer outra rota (dashboards, listas...): resposta genérica e vazia.
  return responder(res, 200, { data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0, from: null, to: null } });
});

servidor.listen(PORTA, "127.0.0.1", () => {
  console.log(`Backend simulado em http://127.0.0.1:${PORTA}`);
});
