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
  cookieName: string;
  regex?: RegExp;
};

export const protectedRoutes: RoutePermission[] = [
  // rotas administrativas
    { path: "/admin/esqueceu-senha", protected: false, isLoginRoute: true, cookieName: "admin_access_token" },
    { path: "/admin/primeiro-acesso", protected: false, isLoginRoute: true, cookieName: "admin_access_token" },
    { path: "/admin/redefinir-senha", protected: false, isLoginRoute: true, cookieName: "admin_access_token" },
    { path: "/admin", protected: false, isLoginRoute: true, cookieName: "admin_access_token" },

    { path: "/admin/dashboard", protected: true, cookieName: "admin_access_token" },
    { path: "/admin/perfil", protected: true, cookieName: "admin_access_token" },

    { path: "/admin/empresas/:id/editar", protected: true, cookieName: "admin_access_token" },
    { path: "/admin/empresas/:id", protected: true, cookieName: "admin_access_token" },
    { path: "/admin/empresas/cadastrar", protected: true, cookieName: "admin_access_token" },
    { path: "/admin/empresas", protected: true, cookieName: "admin_access_token" },

    { path: "/admin/grupos-empresas/:id/visualizar", protected: true, cookieName: "admin_access_token" },
    { path: "/admin/grupos-empresas/:id", protected: true, cookieName: "admin_access_token" },
    { path: "/admin/grupos-empresas/cadastrar", protected: true, cookieName: "admin_access_token" },
    { path: "/admin/grupos-empresas", protected: true, cookieName: "admin_access_token" },

    { path: "/admin/grupos/:id/visualizar", protected: true, cookieName: "admin_access_token" },
    { path: "/admin/grupos/:id", protected: true, cookieName: "admin_access_token" },
    { path: "/admin/grupos/cadastrar", protected: true, cookieName: "admin_access_token" },
    { path: "/admin/grupos", protected: true, cookieName: "admin_access_token" },

    { path: "/admin/usuarios/:id/visualizar", protected: true, cookieName: "admin_access_token" },
    { path: "/admin/usuarios/:id", protected: true, cookieName: "admin_access_token" },
    { path: "/admin/usuarios/cadastrar", protected: true, cookieName: "admin_access_token" },
    { path: "/admin/usuarios", protected: true, cookieName: "admin_access_token" },
  //---

  // rotas privadas
    { path: "/", protected: false, isLoginRoute: true, cookieName: "private_access_token" },
    { path: "/dashboard", protected: true, cookieName: "private_access_token" }
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
