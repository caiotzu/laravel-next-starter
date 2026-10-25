/**
 * SEC-007: o JWT da sessão só pode existir no cookie httpOnly. O navegador nunca deve recebê-lo
 * no corpo da resposta de login/2FA. Roda para os 4 handlers (Admin e Private × login e 2FA).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieSet = vi.hoisted(() => vi.fn());
const axiosPost = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({ cookies: async () => ({ set: cookieSet }) }));
vi.mock("axios", () => ({ default: { post: axiosPost } }));

import { POST as admin2fa } from "@/app/api/auth/admin/2fa/route";
import { POST as adminLogin } from "@/app/api/auth/admin/login/route";
import { POST as private2fa } from "@/app/api/auth/private/2fa/route";
import { POST as privateLogin } from "@/app/api/auth/private/login/route";

const JWT = "eyJ.jwt-secreto-da-sessao.assinatura";

const casos = [
  { nome: "admin login", POST: adminLogin, caminho: "/admin/login", cookie: "admin_access_token", doisFatores: false },
  { nome: "private login", POST: privateLogin, caminho: "/login", cookie: "private_access_token", doisFatores: false },
  { nome: "admin 2fa", POST: admin2fa, caminho: "/admin/2fa/verificar", cookie: "admin_access_token", doisFatores: true },
  { nome: "private 2fa", POST: private2fa, caminho: "/2fa/verificar", cookie: "private_access_token", doisFatores: true },
];

function requisicao(origem: string | null = "http://localhost:3000") {
  const headers: Record<string, string> = { "content-type": "application/json", "user-agent": "vitest" };
  if (origem) headers.origin = origem;
  return new Request("http://localhost:3000/api/auth/x", { method: "POST", headers, body: JSON.stringify({ email: "a@b.com" }) });
}

beforeEach(() => {
  cookieSet.mockReset();
  axiosPost.mockReset();
  vi.stubEnv("BACKEND_URL", "http://backend/api");
  vi.stubEnv("FRONTEND_URL", "http://localhost:3000");
});

describe.each(casos)("BFF $nome", ({ POST, caminho, cookie }) => {
  it("grava o JWT só no cookie httpOnly e NÃO o devolve no corpo da resposta", async () => {
    axiosPost.mockResolvedValue({
      status: 200,
      data: { data: { token: JWT, token_type: "bearer", usuario: { id: "u1", nome: "Maria" } } },
    });

    const resposta = await POST(requisicao());
    const texto = await resposta.text();

    expect(resposta.status).toBe(200);
    expect(texto).not.toContain(JWT);
    expect(JSON.parse(texto)).toEqual({
      status: 200,
      data: { token_type: "bearer", usuario: { id: "u1", nome: "Maria" } },
    });
    expect(cookieSet).toHaveBeenCalledTimes(1);
    expect(cookieSet).toHaveBeenCalledWith(
      cookie,
      JWT,
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 3600 })
    );
  });

  it("chama o backend na rota certa", async () => {
    axiosPost.mockResolvedValue({ status: 200, data: { data: { token: JWT } } });

    await POST(requisicao());

    expect(axiosPost).toHaveBeenCalledWith(`http://backend/api${caminho}`, { email: "a@b.com" }, expect.any(Object));
  });

  it("repassa o erro do backend exatamente como veio e não grava cookie", async () => {
    const erro = { errors: { business: ["Credenciais inválidas."] } };
    axiosPost.mockResolvedValue({ status: 401, data: erro });

    const resposta = await POST(requisicao());

    expect(resposta.status).toBe(401);
    expect(await resposta.json()).toEqual(erro);
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("recusa origem não permitida sem chamar o backend", async () => {
    const resposta = await POST(requisicao("https://site-malicioso.example"));

    expect(resposta.status).toBe(403);
    expect(axiosPost).not.toHaveBeenCalled();
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("devolve 500 genérico (sem vazar detalhes) quando o backend falha", async () => {
    axiosPost.mockRejectedValue(new Error("ECONNREFUSED 10.0.0.5:443 segredo-interno"));

    const resposta = await POST(requisicao());
    const texto = await resposta.text();

    expect(resposta.status).toBe(500);
    expect(texto).not.toContain("segredo-interno");
    expect(cookieSet).not.toHaveBeenCalled();
  });
});

describe.each(casos.filter((c) => !c.doisFatores))("BFF $nome — login com 2FA habilitado", ({ POST }) => {
  it("devolve o temp_token ao navegador e NÃO mexe no cookie da sessão", async () => {
    axiosPost.mockResolvedValue({
      status: 200,
      data: { data: { "2fa_enable": true, temp_token: "7f9c24e8-3b12-4e8a-9d11-0c8d5a1b2f33" } },
    });

    const resposta = await POST(requisicao());

    expect(await resposta.json()).toEqual({
      status: 200,
      data: { "2fa_enable": true, temp_token: "7f9c24e8-3b12-4e8a-9d11-0c8d5a1b2f33" },
    });
    // antes da correção o cookie era gravado vazio, apagando uma sessão válida do mesmo contexto
    expect(cookieSet).not.toHaveBeenCalled();
  });
});

describe.each(casos.filter((c) => c.doisFatores))("BFF $nome — resposta sem token", ({ POST }) => {
  it("falha com 500 e não grava cookie quando o backend não devolve o token", async () => {
    axiosPost.mockResolvedValue({ status: 200, data: { data: { usuario: { id: "u1" } } } });

    const resposta = await POST(requisicao());

    expect(resposta.status).toBe(500);
    expect(await resposta.json()).toEqual({ errors: { business: ["Token não retornado após validação do 2FA."] } });
    expect(cookieSet).not.toHaveBeenCalled();
  });
});
