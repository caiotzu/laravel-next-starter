import { NextRequest } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session/store", async () => {
  const { harness } = await import("../helpers/sessao");

  return { getSessionStore: () => harness.store };
});

import { proxy } from "@/proxy";
import { protectedRoutes } from "@/routes/routes";

import { harness, jwtComExp, reiniciarSessoes, sessaoDeTeste } from "../helpers/sessao";

async function chamar(path: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(`http://localhost:3000${path}`, {
    headers: { cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ") },
  });

  return proxy(req);
}

const destino = (res: Response) => res.headers.get("location");
const liberou = (res: Response) => res.headers.get("x-middleware-next") === "1";

beforeEach(reiniciarSessoes);

describe("proxy.ts (proteção de rotas, com sessão no servidor)", () => {
  it("libera rotas que não estão na lista (ex.: /storage, /perfil) sem consultar o Redis", async () => {
    expect(liberou(await chamar("/storage/avatars/a.png"))).toBe(true);
    expect(liberou(await chamar("/qualquer-coisa"))).toBe(true);
    expect(harness.redis.comandos).toBe(0);
  });

  it("rota protegida sem sessão redireciona para o login da área", async () => {
    expect(destino(await chamar("/home"))).toBe("http://localhost:3000/");
    expect(destino(await chamar("/admin/dashboard"))).toBe("http://localhost:3000/admin");
  });

  it("sessão inexistente, expirada ou lixo no cookie é tratada como ausente", async () => {
    vi.useFakeTimers();
    try {
      const { sid } = await sessaoDeTeste("private", "jwt", 30);
      vi.advanceTimersByTime(31_000);

      expect(destino(await chamar("/home", { private_sid: sid }))).toBe("http://localhost:3000/"); // expirada
      expect(destino(await chamar("/home", { private_sid: "x".repeat(43) }))).toBe("http://localhost:3000/"); // inexistente
      expect(destino(await chamar("/home", { private_sid: "lixo" }))).toBe("http://localhost:3000/"); // malformado
    } finally {
      vi.useRealTimers();
    }
  });

  it("um JWT válido colocado no cookie NÃO vale como sessão (o cookie não é mais o token)", async () => {
    const jwt = jwtComExp(600);

    expect(destino(await chamar("/home", { private_sid: jwt }))).toBe("http://localhost:3000/");
    expect(destino(await chamar("/home", { private_access_token: jwt }))).toBe("http://localhost:3000/"); // nome antigo
    expect(destino(await chamar("/admin/home", { admin_access_token: jwt }))).toBe("http://localhost:3000/admin");
  });

  it("sessão válida libera a rota protegida", async () => {
    const priv = await sessaoDeTeste("private", "jwt-p");
    const admin = await sessaoDeTeste("admin", "jwt-a");

    expect(liberou(await chamar("/home", { private_sid: priv.sid }))).toBe(true);
    expect(liberou(await chamar("/admin/usuarios/123", { admin_sid: admin.sid }))).toBe(true);
  });

  it("sessão de um contexto não abre rota do outro", async () => {
    const priv = await sessaoDeTeste("private", "jwt-p");
    const admin = await sessaoDeTeste("admin", "jwt-a");

    // sid Private apresentado no cookie Admin (e vice-versa) é recusado
    expect(destino(await chamar("/admin/usuarios", { admin_sid: priv.sid }))).toBe("http://localhost:3000/admin");
    expect(destino(await chamar("/home", { private_sid: admin.sid }))).toBe("http://localhost:3000/");
    // e a sessão Private não dá acesso à área Admin
    expect(destino(await chamar("/admin/usuarios", { private_sid: priv.sid }))).toBe("http://localhost:3000/admin");
  });

  it("login com sessão válida redireciona para a home da área", async () => {
    const priv = await sessaoDeTeste("private", "jwt-p");
    const admin = await sessaoDeTeste("admin", "jwt-a");

    expect(destino(await chamar("/", { private_sid: priv.sid }))).toBe("http://localhost:3000/home");
    expect(destino(await chamar("/admin", { admin_sid: admin.sid }))).toBe("http://localhost:3000/admin/home");
  });

  it("tela de login sem sessão é liberada, sem consultar o Redis quando não há cookie", async () => {
    expect(liberou(await chamar("/"))).toBe(true);
    expect(liberou(await chamar("/admin/esqueceu-senha"))).toBe(true);
    expect(harness.redis.comandos).toBe(0);
  });

  it("aba de suporte: sessão admin acessa rota visual do private; expirada não", async () => {
    const admin = await sessaoDeTeste("admin", "jwt-a");

    expect(liberou(await chamar("/empresas", { admin_sid: admin.sid }))).toBe(true);
    expect(destino(await chamar("/empresas", { admin_sid: "y".repeat(43) }))).toBe("http://localhost:3000/");
  });

  it("rotas dinâmicas casam por :id", async () => {
    expect(destino(await chamar("/usuarios/abc/visualizar"))).toBe("http://localhost:3000/");
  });

  it("Redis fora do ar: FECHA (trata como não autenticado) em vez de liberar a rota protegida", async () => {
    const priv = await sessaoDeTeste("private", "jwt-p");
    harness.redis.indisponivel = true;

    expect(destino(await chamar("/home", { private_sid: priv.sid }))).toBe("http://localhost:3000/");
    expect(liberou(await chamar("/", { private_sid: priv.sid }))).toBe(true); // tela de login continua acessível
  });

  it("vários usuários ao mesmo tempo: cada sessão libera só o que é dela", async () => {
    const sessoes = await Promise.all(Array.from({ length: 30 }, (_, i) => sessaoDeTeste("private", `jwt-${i}`)));

    const resultados = await Promise.all([
      ...sessoes.map((s) => chamar("/home", { private_sid: s.sid })),
      chamar("/home", { private_sid: "z".repeat(43) }), // intruso entre os usuários legítimos
    ]);

    expect(resultados.slice(0, 30).every(liberou)).toBe(true);
    expect(destino(resultados[30])).toBe("http://localhost:3000/");
  });
});

describe("routes.ts", () => {
  it("gera regex para todas as rotas", () => {
    expect(protectedRoutes.every((r) => r.regex instanceof RegExp)).toBe(true);
  });

  it("toda rota pertence a um contexto (admin ou private)", () => {
    expect(protectedRoutes.every((r) => r.contexto === "admin" || r.contexto === "private")).toBe(true);
  });

  it("regex de :id não casa com barras", () => {
    const rota = protectedRoutes.find((r) => r.path === "/admin/usuarios/:id")!;
    expect(rota.regex!.test("/admin/usuarios/1")).toBe(true);
    expect(rota.regex!.test("/admin/usuarios/1/visualizar")).toBe(false);
  });
});
