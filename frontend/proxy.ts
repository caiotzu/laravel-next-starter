// proxy.ts (antigo middleware.ts; convenção renomeada no Next.js 16)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  // Se não for rota definida -> libera
  if (!route) return NextResponse.next();

  const sidDe = (contexto: ContextoSessao) => req.cookies.get(nomeCookieSessao(contexto))?.value;

  // Se tiver sessão e for rota de login -> redireciona para dashboard correto
  if (route.isLoginRoute) {
    if (await sessaoEhValida(route.contexto, sidDe(route.contexto))) {
      return NextResponse.redirect(new URL(HOME[route.contexto], req.url));
    }

    // Rota de login pública → libera
    return NextResponse.next();
  }

  // Se rota não for protegida -> libera
  if (!route.protected) return NextResponse.next();

  if (await sessaoEhValida(route.contexto, sidDe(route.contexto))) {
    return NextResponse.next();
  }

  // Uma aba de suporte usa a identidade Admin original para acessar as
  // rotas visuais da área Private. A autorização real continua no backend:
  // sem X-Acesso-Suporte-Id válido, as APIs Private não concedem acesso.
  if (route.contexto === "private" && (await sessaoEhValida("admin", sidDe("admin")))) {
    return NextResponse.next();
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
