// proxy.ts (antigo middleware.ts; convenção renomeada no Next.js 16)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  CABECALHO_NONCE,
  cabecalhoDaCsp,
  construirCsp,
  gerarNonce,
  origemDoBackend,
  rotaRecebeCspComNonce,
} from "./lib/security/csp";
import { nomeCookieSessao } from "./lib/session/cookie";
import type { ContextoSessao } from "./lib/session/tipos";
import { sessaoEhValida } from "./lib/session/validar";
import { protectedRoutes } from "./routes/routes";

const HOME: Record<ContextoSessao, string> = {
  admin: "/admin/home",
  private: "/home",
};

const LOGIN: Record<ContextoSessao, string> = {
  admin: "/admin",
  private: "/",
};

/**
 * Quem decide se há sessão é o servidor: o cookie só traz um identificador opaco (`sid`) e a
 * existência/validade da sessão é conferida no Redis. O navegador não tem JWT para o proxy ler.
 *
 * Só consulta o Redis nas rotas listadas em `routes/routes.ts` (as demais passam direto) e, nas
 * telas de login, só se houver cookie.
 */
export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Ordena rotas do mais específico para o mais genérico
  const sortedRoutes = [...protectedRoutes].sort((a, b) => b.path.length - a.path.length);

  // Encontra rota correspondente
  const route = sortedRoutes.find((r) => r.regex!.test(pathname));

  // CSP com nonce por requisição (SEC-008 / F-09). O nonce vai no header da REQUISIÇÃO para o
  // Next aplicá-lo nos próprios scripts e para o layout lê-lo (`x-nonce`), e a política vai no
  // header da RESPOSTA para o navegador impô-la.
  const nomeCsp = cabecalhoDaCsp(process.env.CSP_MODO);
  const comNonce = rotaRecebeCspComNonce(pathname);
  const nonce = comNonce ? gerarNonce() : null;
  const csp = nonce
    ? construirCsp({
        nonce,
        producao: process.env.NODE_ENV === "production",
        origemBackend: origemDoBackend(process.env.BACKEND_URL),
      })
    : null;

  const liberar = () => {
    if (!nonce || !csp) return NextResponse.next();

    const cabecalhos = new Headers(req.headers);
    cabecalhos.set(CABECALHO_NONCE, nonce);
    cabecalhos.set(nomeCsp, csp);

    const resposta = NextResponse.next({ request: { headers: cabecalhos } });
    resposta.headers.set(nomeCsp, csp);

    return resposta;
  };

  // Se não for rota definida -> libera
  if (!route) return liberar();

  const sidDe = (contexto: ContextoSessao) => req.cookies.get(nomeCookieSessao(contexto))?.value;

  // Se tiver sessão e for rota de login -> redireciona para dashboard correto
  if (route.isLoginRoute) {
    if (await sessaoEhValida(route.contexto, sidDe(route.contexto))) {
      return NextResponse.redirect(new URL(HOME[route.contexto], req.url));
    }

    // Rota de login pública → libera
    return liberar();
  }

  // Se rota não for protegida -> libera
  if (!route.protected) return liberar();

  if (await sessaoEhValida(route.contexto, sidDe(route.contexto))) {
    return liberar();
  }

  // Uma aba de suporte usa a identidade Admin original para acessar as
  // rotas visuais da área Private. A autorização real continua no backend:
  // sem X-Acesso-Suporte-Id válido, as APIs Private não concedem acesso.
  if (route.contexto === "private" && (await sessaoEhValida("admin", sidDe("admin")))) {
    return liberar();
  }

  return NextResponse.redirect(new URL(LOGIN[route.contexto], req.url));
}

// Define quais rotas passam pelo proxy
export const config = {
  matcher: [
    "/",
    "/admin",
    "/admin/:path*",
    "/:path*"
  ],
};
