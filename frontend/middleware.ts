// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { protectedRoutes } from "./routes/routes";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Ordena rotas do mais específico para o mais genérico
  const sortedRoutes = [...protectedRoutes].sort((a, b) => b.path.length - a.path.length);

  // Encontra rota correspondente
  const route = sortedRoutes.find((r) => r.regex!.test(pathname));

  // Se não for rota definida -> libera
  if (!route) return NextResponse.next();

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
    "/admin/:path*"
  ],
};
