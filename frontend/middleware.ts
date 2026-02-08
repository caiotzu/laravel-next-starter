// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import jwt from "jsonwebtoken";

import { protectedRoutes } from "./routes/routes";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Ordena rotas do mais específico para o mais genérico
  const sortedRoutes = [...protectedRoutes].sort((a, b) => b.path.length - a.path.length);

  // Encontra rota correspondente
  const route = sortedRoutes.find((r) => r.regex!.test(pathname));

  // Se não for rota definida -> libera
  if (!route) return NextResponse.next();

  // Se tiver token e for rota de login -> redireciona para dashboard correto
  if (route.isLoginRoute) {
    const token = route.cookieName ? req.cookies.get(route.cookieName)?.value : null;

    if (token && isTokenValid(token)) {
      let redirectPath = "/dashboard";
      switch (route.cookieName) {
        case "admin_access_token":
          redirectPath = "/admin/dashboard";
          break;
        case "private_access_token":
          redirectPath = "/dashboard";
          break;
      }

      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    // Rota de login pública → libera
    return NextResponse.next();
  }

  // Se rota não for protegida -> libera
  if (!route.protected) return NextResponse.next();

  // Pega token do cookie definido na rota
  const token = route.cookieName ? req.cookies.get(route.cookieName)?.value : null;

  // Se não tiver token -> redireciona para login correto
  if (!token || !isTokenValid(token)) {
    let loginPath = "/";
    switch (route.cookieName) {
      case "admin_access_token":
        loginPath = "/admin";
        break;
      case "private_access_token":
        loginPath = "/";
        break;
    }

    return NextResponse.redirect(new URL(loginPath, req.url));
  }
  
  // Tudo certo -> permite acessar
  return NextResponse.next();
}

// Verifica se o token é valido e não expirou
function isTokenValid(token: string) {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (!decoded?.exp) return false;
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

// Define quais rotas passam pelo middleware
export const config = {
  matcher: [
    "/",
    "/admin",
    "/admin/:path*",
    "/:path*"
  ],
};
