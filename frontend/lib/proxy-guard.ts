import type { Method } from "axios";

/**
 * Validações do proxy genérico (/api/proxy/admin e /api/proxy/private).
 *
 * O proxy recebe do navegador { url, method, headers, data } e repassa ao Laravel com o
 * token do cookie httpOnly. Sem estas travas o cliente controlava o destino (../ para sair de
 * /api; @host quando BACKEND_URL não tem path), o método e QUALQUER header (inclusive
 * Authorization e X-Forwarded-For). A autorização real continua no backend; aqui só
 * garantimos que o BFF nunca chame nada fora da API.
 */

const METODOS_PERMITIDOS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

/**
 * Únicos headers que o cliente pode enviar através do proxy.
 * Chave: nome em minúsculas; valor: nome canônico repassado ao backend.
 */
const HEADERS_PERMITIDOS: Record<string, string> = {
  "x-acesso-suporte-id": "X-Acesso-Suporte-Id",
};

/**
 * Endpoints de autenticação do Laravel que o proxy NUNCA encaminha (sem o prefixo `admin/`).
 *
 * `refresh` (e `login`/`2fa/verificar`) devolvem um JWT no corpo da resposta e o proxy repassa o
 * corpo ao navegador: um script na página poderia pedir um token novo e ficar com ele, anulando
 * a garantia de que o JWT só existe no servidor (SEC-009). Login, 2FA e logout têm handlers
 * próprios em `app/api/auth/**` (que guardam o token na sessão); a aplicação também não usa
 * renovação de token.
 */
const ROTAS_DE_AUTENTICACAO = new Set(["login", "2fa/verificar", "refresh", "logout"]);

function ehRotaDeAutenticacao(caminhoRelativo: string): boolean {
  let decodificado: string;

  try {
    // O servidor decodifica o path antes de rotear: `/refre%73h` chega como `/refresh`.
    decodificado = decodeURIComponent(caminhoRelativo);
  } catch {
    return true; // percent-encoding malformado: na dúvida, recusa
  }

  const normalizado = decodificado
    .toLowerCase()
    .replace(/\/{2,}/g, "/")
    .replace(/^\/|\/$/g, "")
    .replace(/^admin\//, "");

  return ROTAS_DE_AUTENTICACAO.has(normalizado);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function metodoPermitido(metodo: unknown): Method | null {
  const normalizado = String(metodo ?? "GET").toUpperCase();

  return METODOS_PERMITIDOS.has(normalizado) ? (normalizado as Method) : null;
}

/**
 * Monta a URL final do backend a partir do caminho pedido pelo cliente, ou null se o caminho
 * for suspeito, resolver para fora de BACKEND_URL (host diferente ou fora do prefixo /api) ou for
 * um endpoint de autenticação (login, 2FA, refresh, logout).
 */
export function resolverUrlBackend(caminho: unknown): string | null {
  const base = process.env.BACKEND_URL;

  if (!base || typeof caminho !== "string") return null;

  // Precisa ser um path absoluto simples: "/usuarios?x=1". Bloqueia "//host", "\", controle
  // e variações codificadas de "." "/" "\" que alguns servidores decodificam antes de rotear.
  if (!caminho.startsWith("/") || caminho.startsWith("//")) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(caminho)) return null;

  // A restrição de "." "/" "\\" codificados vale só para o PATH: na query string (?busca=a%2Fb)
  // eles são legítimos e não alteram para onde a requisição vai.
  const [pathPuro] = caminho.split(/[?#]/, 1);
  if (/%2e|%2f|%5c|%00/i.test(pathPuro)) return null;

  try {
    const urlBase = new URL(base);
    const prefixo = urlBase.pathname.replace(/\/+$/, "");
    const alvo = new URL(`${urlBase.origin}${prefixo}${caminho}`);

    if (alvo.origin !== urlBase.origin) return null;
    if (alvo.pathname !== prefixo && !alvo.pathname.startsWith(`${prefixo}/`)) return null;

    if (ehRotaDeAutenticacao(alvo.pathname.slice(prefixo.length))) return null;

    return alvo.toString();
  } catch {
    return null;
  }
}

/** Mantém só os headers da allowlist (e valida o formato do valor). */
export function filtrarHeadersCliente(headers: unknown): Record<string, string> {
  const saida: Record<string, string> = {};

  if (!headers || typeof headers !== "object") return saida;

  for (const [nome, valor] of Object.entries(headers as Record<string, unknown>)) {
    const chave = nome.toLowerCase();

    const canonico = HEADERS_PERMITIDOS[chave];

    if (!canonico || typeof valor !== "string") continue;

    if (chave === "x-acesso-suporte-id" && !UUID.test(valor)) continue;

    saida[canonico] = valor;
  }

  return saida;
}
