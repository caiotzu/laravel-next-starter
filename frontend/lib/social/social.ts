import { randomBytes } from "node:crypto";

import type { ContextoSessao } from "@/lib/session/tipos";

/**
 * Login social (Google e futuros provedores) — peças puras do BFF.
 *
 * O fluxo inteiro é decidido pelo backend (state, PKCE, vínculo com o usuário). O BFF só:
 *  1. gera o `binding` (aleatório) e o guarda num cookie httpOnly de vida curta — é o que amarra
 *     o retorno do provedor ao NAVEGADOR que iniciou o fluxo (proteção contra "login CSRF");
 *  2. recebe o retorno do provedor, entrega code/state/binding ao backend e abre a sessão.
 */

export const PROVEDOR_REGEX = /^[a-z0-9_-]{1,30}$/;

/** O binding vale o mesmo que o `state` no backend (10 minutos). */
const TTL_BINDING_SEGUNDOS = 10 * 60;

const producao = () => process.env.NODE_ENV === "production";

/** Nome do cookie do binding (um por contexto; `__Host-` em produção, como o cookie de sessão). */
export function nomeCookieSocial(contexto: ContextoSessao): string {
  const base = `${contexto}_social`;

  return producao() ? `__Host-${base}` : base;
}

/**
 * `sameSite: lax` é obrigatório aqui: o retorno do provedor é uma navegação cross-site de nível
 * superior (GET), e só cookies Lax acompanham esse tipo de navegação.
 */
export function opcoesCookieSocial(maxAgeSegundos: number = TTL_BINDING_SEGUNDOS) {
  return {
    httpOnly: true,
    secure: producao(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSegundos,
  };
}

/**
 * Cookie do binding do VÍNCULO (aba "Login social" do perfil). É separado do binding de login: o
 * callback é o mesmo para os dois, e é a presença de UM ou OUTRO cookie que diz qual fluxo foi
 * iniciado neste navegador. O backend confere de novo (o state guarda a finalidade).
 */
export function nomeCookieVinculo(contexto: ContextoSessao): string {
  const base = `${contexto}_social_vinculo`;

  return producao() ? `__Host-${base}` : base;
}

/** 256 bits em base64url (43 caracteres; o backend exige 32 a 128). */
export function gerarBinding(): string {
  return randomBytes(32).toString("base64url");
}

/** Caminho no BACKEND do perfil → login social (vínculo). */
export function caminhoBackendPerfilSocial(contexto: ContextoSessao, resto: string): string {
  const prefixo = contexto === "admin" ? "/admin" : "";

  return `${prefixo}/perfil/login-social/${resto}`;
}

/** Caminho no BACKEND (Admin tem prefixo `/admin`; Private não). */
export function caminhoBackendSocial(contexto: ContextoSessao, resto: string): string {
  const prefixo = contexto === "admin" ? "/admin" : "";

  return `${prefixo}/login/social/${resto}`;
}

const LOGIN: Record<ContextoSessao, string> = { admin: "/admin", private: "/" };
const HOME: Record<ContextoSessao, string> = { admin: "/admin/home", private: "/home" };

/** Códigos de erro que o BFF passa à tela de login (`?erro=`). Nunca texto vindo de fora. */
export type CodigoErroSocial = "negado" | "expirado" | "cancelado" | "limite" | "indisponivel";

const MENSAGENS: Record<CodigoErroSocial, string> = {
  negado: "Não foi possível entrar com esta conta. Verifique se ela está autorizada a acessar a plataforma.",
  expirado: "A tentativa de login expirou ou é inválida. Tente novamente.",
  cancelado: "O login foi cancelado.",
  limite: "Muitas tentativas de login. Tente novamente em alguns minutos.",
  indisponivel: "O login social está indisponível no momento. Tente novamente em instantes.",
};

const PREFIXO_ERRO = "social_";

/** Mensagem da tela de login para o parâmetro `?erro=`; `null` se não for um erro social conhecido. */
export function mensagemErroSocial(valor: string | null): string | null {
  if (!valor || !valor.startsWith(PREFIXO_ERRO)) return null;

  const codigo = valor.slice(PREFIXO_ERRO.length) as CodigoErroSocial;

  return Object.hasOwn(MENSAGENS, codigo) ? MENSAGENS[codigo] : null;
}

export function codigoErroPorStatus(status: number): CodigoErroSocial {
  if (status === 401) return "negado";
  if (status === 429) return "limite";
  if (status >= 500) return "indisponivel";

  return "expirado";
}

/** Origem do frontend (FRONTEND_URL), com a da requisição como reserva. */
export function origemDoFrontend(req: Request): string {
  try {
    if (process.env.FRONTEND_URL) return new URL(process.env.FRONTEND_URL).origin;
  } catch {
    // cai na origem da requisição
  }

  return new URL(req.url).origin;
}

export function urlLoginComErro(req: Request, contexto: ContextoSessao, codigo: CodigoErroSocial): URL {
  return new URL(`${LOGIN[contexto]}?erro=${PREFIXO_ERRO}${codigo}`, origemDoFrontend(req));
}

/**
 * Login concluído. `login_social=1` avisa o Banner de que houve um login novo (ver
 * `marcarNovoLoginSocial`); o login por senha faz isso no cliente, aqui o redirect vem do servidor.
 */
export function urlAposLogin(req: Request, contexto: ContextoSessao): URL {
  return new URL(`${HOME[contexto]}?login_social=1`, origemDoFrontend(req));
}

/**
 * 2FA pendente: o `temp_token` vai no FRAGMENTO da URL (nunca enviado ao servidor, sem log nem
 * `Referer`) e a tela de login o move para o estado em memória e limpa a URL.
 */
export function urlSegundoFator(req: Request, contexto: ContextoSessao, tempToken: string): URL {
  return new URL(`${LOGIN[contexto]}#social-2fa=${encodeURIComponent(tempToken)}`, origemDoFrontend(req));
}

const PERFIL: Record<ContextoSessao, string> = { admin: "/admin/perfil", private: "/perfil" };

/** Resultado do vínculo que o BFF passa à aba (`?vinculo=`). Nunca texto vindo de fora. */
export type ResultadoVinculo = "ok" | "cancelado" | "invalido" | "limite" | "indisponivel";

const MENSAGENS_VINCULO: Record<Exclude<ResultadoVinculo, "ok">, string> = {
  cancelado: "A vinculação foi cancelada.",
  invalido:
    "Não foi possível vincular a conta. Ela pode já estar vinculada a outro usuário, ter o e-mail não verificado ou a tentativa pode ter expirado. Tente novamente.",
  limite: "Muitas tentativas. Tente novamente em alguns minutos.",
  indisponivel: "O login social está indisponível no momento. Tente novamente em instantes.",
};

/** Interpreta `?vinculo=`; `null` se não for um resultado conhecido. */
export function interpretarResultadoVinculo(
  valor: string | null
): { tipo: "sucesso" | "erro"; mensagem: string } | null {
  if (valor === "ok") return { tipo: "sucesso", mensagem: "Conta vinculada com sucesso!" };

  if (valor && Object.hasOwn(MENSAGENS_VINCULO, valor)) {
    return { tipo: "erro", mensagem: MENSAGENS_VINCULO[valor as Exclude<ResultadoVinculo, "ok">] };
  }

  return null;
}

export function resultadoVinculoPorStatus(status: number): ResultadoVinculo {
  if (status === 429) return "limite";
  if (status >= 500) return "indisponivel";

  return "invalido";
}

/** Volta para a aba "Login social" do perfil com o resultado do vínculo. */
export function urlPerfilComVinculo(req: Request, contexto: ContextoSessao, resultado: ResultadoVinculo): URL {
  return new URL(`${PERFIL[contexto]}?aba=login-social&vinculo=${resultado}`, origemDoFrontend(req));
}

/** Só segue para o provedor uma URL https (http só fora de produção, para ambientes locais). */
export function urlAutorizacaoValida(url: unknown): url is string {
  if (typeof url !== "string") return false;

  try {
    const { protocol } = new URL(url);

    return protocol === "https:" || (!producao() && protocol === "http:");
  } catch {
    return false;
  }
}
