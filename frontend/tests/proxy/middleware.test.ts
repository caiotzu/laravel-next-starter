import { NextRequest } from "next/server";

import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import { proxy } from "@/proxy";
import { protectedRoutes } from "@/routes/routes";

const token = (expOffset: number) =>
  jwt.sign({ exp: Math.floor(Date.now() / 1000) + expOffset }, "segredo");

function chamar(path: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(`http://localhost:3000${path}`, {
    headers: { cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ") },
  });
  return proxy(req);
}

const destino = (res: Response) => res.headers.get("location");

describe("proxy.ts (proteção de rotas)", () => {
  it("libera rotas que não estão na lista (ex.: /storage, /perfil)", () => {
    expect(chamar("/storage/avatars/a.png").headers.get("x-middleware-next")).toBe("1");
    expect(chamar("/qualquer-coisa").headers.get("x-middleware-next")).toBe("1");
  });

  it("rota protegida sem token redireciona para o login da área", () => {
    expect(destino(chamar("/home"))).toBe("http://localhost:3000/");
    expect(destino(chamar("/admin/dashboard"))).toBe("http://localhost:3000/admin");
  });

  it("token expirado ou inválido é tratado como ausente", () => {
    expect(destino(chamar("/home", { private_access_token: token(-60) }))).toBe("http://localhost:3000/");
    expect(destino(chamar("/home", { private_access_token: "lixo" }))).toBe("http://localhost:3000/");
  });

  it("token válido libera a rota protegida", () => {
    expect(chamar("/home", { private_access_token: token(600) }).headers.get("x-middleware-next")).toBe("1");
    expect(chamar("/admin/usuarios/123", { admin_access_token: token(600) }).headers.get("x-middleware-next")).toBe("1");
  });

  it("login com sessão válida redireciona para a home da área", () => {
    expect(destino(chamar("/", { private_access_token: token(600) }))).toBe("http://localhost:3000/home");
    expect(destino(chamar("/admin", { admin_access_token: token(600) }))).toBe("http://localhost:3000/admin/home");
  });

  it("tela de login sem sessão é liberada", () => {
    expect(chamar("/").headers.get("x-middleware-next")).toBe("1");
    expect(chamar("/admin/esqueceu-senha").headers.get("x-middleware-next")).toBe("1");
  });

  it("aba de suporte: token admin acessa rota visual do private", () => {
    expect(chamar("/empresas", { admin_access_token: token(600) }).headers.get("x-middleware-next")).toBe("1");
    expect(destino(chamar("/empresas", { admin_access_token: token(-10) }))).toBe("http://localhost:3000/");
  });

  it("rotas dinâmicas casam por :id", () => {
    expect(destino(chamar("/usuarios/abc/visualizar"))).toBe("http://localhost:3000/");
  });
});

describe("routes.ts", () => {
  it("gera regex para todas as rotas", () => {
    expect(protectedRoutes.every((r) => r.regex instanceof RegExp)).toBe(true);
  });

  it("regex de :id não casa com barras", () => {
    const rota = protectedRoutes.find((r) => r.path === "/admin/usuarios/:id")!;
    expect(rota.regex!.test("/admin/usuarios/1")).toBe(true);
    expect(rota.regex!.test("/admin/usuarios/1/visualizar")).toBe(false);
  });
});
