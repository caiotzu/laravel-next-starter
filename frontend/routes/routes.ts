import type { ContextoSessao } from "@/lib/session/tipos";

/**
 * Importante
 *  As rotas que forem adicionadas devem sempre vir na ordem mais específica para a menos 
 *  específica.
 *  Criação de rotas dinâmicas devem sempre ser :id. Ex: admin/usuarios/:id
 */

export type RoutePermission = {
  path: string;
  protected: boolean;
  isLoginRoute?: boolean;
  /** Área a que a rota pertence (define qual sessão vale: Admin ou Private). */
  contexto: ContextoSessao;
  regex?: RegExp;
};

export const protectedRoutes: RoutePermission[] = [
  // rotas administrativas
    { path: "/admin/esqueceu-senha", protected: false, isLoginRoute: true, contexto: "admin" },
    { path: "/admin/primeiro-acesso", protected: false, isLoginRoute: true, contexto: "admin" },
    { path: "/admin/redefinir-senha", protected: false, isLoginRoute: true, contexto: "admin" },
    { path: "/admin", protected: false, isLoginRoute: true, contexto: "admin" },

    { path: "/admin/home", protected: true, contexto: "admin" },
    { path: "/admin/dashboard", protected: true, contexto: "admin" },
    { path: "/admin/perfil", protected: true, contexto: "admin" },

    { path: "/admin/grupos-empresas/:id/visualizar", protected: true, contexto: "admin" },
    { path: "/admin/grupos-empresas/:id", protected: true, contexto: "admin" },
    { path: "/admin/grupos-empresas/cadastrar", protected: true, contexto: "admin" },
    { path: "/admin/grupos-empresas", protected: true, contexto: "admin" },

    { path: "/admin/empresas/:id/visualizar", protected: true, contexto: "admin" },
    { path: "/admin/empresas/:id", protected: true, contexto: "admin" },
    { path: "/admin/empresas/cadastrar", protected: true, contexto: "admin" },
    { path: "/admin/empresas", protected: true, contexto: "admin" },

    { path: "/admin/grupos/:id/visualizar", protected: true, contexto: "admin" },
    { path: "/admin/grupos/:id", protected: true, contexto: "admin" },
    { path: "/admin/grupos/cadastrar", protected: true, contexto: "admin" },
    { path: "/admin/grupos", protected: true, contexto: "admin" },

    { path: "/admin/usuarios/:id/visualizar", protected: true, contexto: "admin" },
    { path: "/admin/usuarios/:id", protected: true, contexto: "admin" },
    { path: "/admin/usuarios/cadastrar", protected: true, contexto: "admin" },
    { path: "/admin/usuarios", protected: true, contexto: "admin" },

    { path: "/admin/acessos-suporte/:id/suporte", protected: true, contexto: "admin" },
    { path: "/admin/acessos-suporte", protected: true, contexto: "admin" },
  //---

  // rotas privadas
    { path: "/esqueceu-senha", protected: false, isLoginRoute: true, contexto: "private" },
    { path: "/primeiro-acesso", protected: false, isLoginRoute: true, contexto: "private" },
    { path: "/redefinir-senha", protected: false, isLoginRoute: true, contexto: "private" },
    { path: "/", protected: false, isLoginRoute: true, contexto: "private" },

    { path: "/", protected: false, isLoginRoute: true, contexto: "private" },
    { path: "/home", protected: true, contexto: "private" },
    { path: "/dashboard", protected: true, contexto: "private" },

    { path: "/empresas/:id/visualizar", protected: true, contexto: "private" },
    { path: "/empresas/:id", protected: true, contexto: "private" },
    { path: "/empresas/cadastrar", protected: true, contexto: "private" },
    { path: "/empresas", protected: true, contexto: "private" },

    { path: "/grupos/:id/visualizar", protected: true, contexto: "private" },
    { path: "/grupos/:id", protected: true, contexto: "private" },
    { path: "/grupos/cadastrar", protected: true, contexto: "private" },
    { path: "/grupos", protected: true, contexto: "private" },

    { path: "/usuarios/:id/visualizar", protected: true, contexto: "private" },
    { path: "/usuarios/:id", protected: true, contexto: "private" },
    { path: "/usuarios/cadastrar", protected: true, contexto: "private" },
    { path: "/usuarios", protected: true, contexto: "private" },

    { path: "/acesso-suporte/conceder", protected: true, contexto: "private" },
    { path: "/acesso-suporte", protected: true, contexto: "private" },
  //---
];

/**
 * Gera regex para todas as rotas
 * Faz isso para que seja possível termos rotas dinâmicas.
 */
protectedRoutes.forEach((route) => {
  const regexString = "^" + route.path.replace(/:[^/]+/g, "[^/]+") + "$";
  route.regex = new RegExp(regexString);
});
