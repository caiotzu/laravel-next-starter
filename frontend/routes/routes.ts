/**
 * Importante
 *  As rotas que forem adicionadas devem sempre vir na ordem mais específica para a menos 
 *  específica.
 *  Criação de rotas dinâmicas devem sempre ser :id. Ex: admin/usuarios/:id
 */

export type RoutePermission = {
  path: string;
  protected: boolean;
  cookieName?: string;
  regex?: RegExp;
};

export const protectedRoutes: RoutePermission[] = [
  { path: "/admin", protected: false },
  { path: "/admin/dashboard", protected: true, cookieName: "admin_access_token" }
];

/**
 * Gera regex para todas as rotas
 * Faz isso para que seja possível termos rotas dinâmicas.
 */
protectedRoutes.forEach((route) => {
  const regexString = "^" + route.path.replace(/:[^/]+/g, "[^/]+") + "$";
  route.regex = new RegExp(regexString);
});
