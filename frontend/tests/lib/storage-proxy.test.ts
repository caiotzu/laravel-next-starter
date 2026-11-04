/**
 * `/storage` (avatares e imagens de banner enviados por usuários) é atendido por um Route
 * Handler que valida o caminho, busca no backend e devolve cabeçalhos de segurança.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/storage/[...caminho]/route";

import {
  cabecalhosParaOBackend,
  cabecalhosParaONavegador,
  origemDoStorage,
  segmentosDeStorageValidos,
} from "@/lib/storage-proxy";

const fetchFalso = vi.fn();

beforeEach(() => {
  fetchFalso.mockReset();
  vi.stubGlobal("fetch", fetchFalso);
  vi.stubEnv("BACKEND_URL", "http://backend.interno:8080/api");
  vi.stubEnv("BACKEND_STORAGE_URL", "");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const chamar = (caminho: string[], cabecalhos: Record<string, string> = {}) =>
  GET(new Request(`http://localhost:3000/storage/${caminho.join("/")}`, { headers: cabecalhos }), { params: Promise.resolve({ caminho }) });

describe("origemDoStorage", () => {
  it("usa BACKEND_STORAGE_URL quando existe, senão a origem de BACKEND_URL", () => {
    expect(origemDoStorage({ BACKEND_URL: "http://b.interno:8080/api" })).toBe("http://b.interno:8080");
    expect(origemDoStorage({ BACKEND_URL: "http://b/api", BACKEND_STORAGE_URL: "https://cdn.exemplo.com/x" })).toBe("https://cdn.exemplo.com");
  });

  it.each([undefined, "", "nao-e-url", "ftp://x", "javascript:alert(1)", "file:///etc/passwd"])("recusa %s", (valor) => {
    expect(origemDoStorage({ BACKEND_URL: valor })).toBeNull();
  });
});

describe("segmentosDeStorageValidos", () => {
  it("aceita caminhos de arquivos gerados", () => {
    expect(segmentosDeStorageValidos(["avatars", "9b1deb4d-3b7d.png"])).toBe(true);
    expect(segmentosDeStorageValidos(["banners", "2026", "Foto do banner (1).webp".replace(/[()]/g, "")])).toBe(true);
  });

  it.each([
    [[]],
    [undefined],
    [[".."]],
    [["avatars", ".."]],
    [["avatars", "..", "x.png"]],
    [["."]],
    [[".env"]],
    [["a/b"]],
    [["a\\b"]],
    [["a\u0000b.png"]],
    [["a\nb.png"]],
    [["a..b.png"]],
    [["%2e%2e"]],
    [[""]],
    [["x".repeat(256)]],
    [Array.from({ length: 9 }, () => "a")],
  ])("recusa %j", (segmentos) => {
    expect(segmentosDeStorageValidos(segmentos as string[] | undefined)).toBe(false);
  });
});

describe("cabecalhosParaOBackend", () => {
  it("repassa só cache e trecho (range); nunca cookies, Authorization ou Host", () => {
    const saida = cabecalhosParaOBackend(
      new Headers({ range: "bytes=0-99", "if-none-match": '"abc"', cookie: "admin_sid=segredo", authorization: "Bearer x", host: "evil", "x-forwarded-for": "1.2.3.4" })
    );

    expect(saida.get("range")).toBe("bytes=0-99");
    expect(saida.get("if-none-match")).toBe('"abc"');
    for (const nome of ["cookie", "authorization", "host", "x-forwarded-for"]) expect(saida.get(nome), nome).toBeNull();
  });
});

describe("cabecalhosParaONavegador", () => {
  it.each(["image/png", "image/jpeg", "image/webp", "image/gif"])("%s é exibido inline", (tipo) => {
    const saida = cabecalhosParaONavegador(new Headers({ "content-type": `${tipo}; charset=binary`, etag: '"v1"' }));

    expect(saida.get("content-type")).toBe(tipo);
    expect(saida.get("content-disposition")).toBeNull();
    expect(saida.get("etag")).toBe('"v1"');
  });

  it.each(["text/html", "image/svg+xml", "application/javascript", "application/json", "text/plain", ""])(
    "%s vira download (nunca interpretado pelo navegador)",
    (tipo) => {
      const saida = cabecalhosParaONavegador(new Headers({ "content-type": tipo }));

      expect(saida.get("content-type")).toBe("application/octet-stream");
      expect(saida.get("content-disposition")).toBe("attachment");
    }
  );

  it("sempre leva os cabeçalhos de segurança e NUNCA os do backend (Set-Cookie, Server, X-Powered-By)", () => {
    const saida = cabecalhosParaONavegador(
      new Headers({ "content-type": "image/png", "set-cookie": "x=1", server: "nginx/1.2", "x-powered-by": "PHP/8.4", location: "http://interno/" })
    );

    expect(saida.get("x-content-type-options")).toBe("nosniff");
    expect(saida.get("x-frame-options")).toBe("DENY");
    expect(saida.get("content-security-policy")).toContain("sandbox");
    expect(saida.get("cross-origin-resource-policy")).toBe("same-origin");
    for (const nome of ["set-cookie", "server", "x-powered-by", "location"]) expect(saida.get(nome), nome).toBeNull();
  });
});

describe("GET /storage/[...caminho]", () => {
  it("busca <origem do backend>/storage/<caminho> e devolve o arquivo com os cabeçalhos de segurança", async () => {
    fetchFalso.mockResolvedValue(new Response("PNGDATA", { status: 200, headers: { "content-type": "image/png", "content-length": "7", "set-cookie": "x=1" } }));

    const resposta = await chamar(["avatars", "a.png"], { range: "bytes=0-6", cookie: "admin_sid=segredo" });

    expect(String(fetchFalso.mock.calls[0][0])).toBe("http://backend.interno:8080/storage/avatars/a.png");
    expect(fetchFalso.mock.calls[0][1].redirect).toBe("manual");
    expect(fetchFalso.mock.calls[0][1].headers.get("range")).toBe("bytes=0-6");
    expect(fetchFalso.mock.calls[0][1].headers.get("cookie")).toBeNull();

    expect(resposta.status).toBe(200);
    expect(await resposta.text()).toBe("PNGDATA");
    expect(resposta.headers.get("content-type")).toBe("image/png");
    expect(resposta.headers.get("x-content-type-options")).toBe("nosniff");
    expect(resposta.headers.get("content-security-policy")).toContain("sandbox");
    expect(resposta.headers.get("set-cookie")).toBeNull();
  });

  it("não vaza o endereço interno do backend em nenhum cabeçalho", async () => {
    fetchFalso.mockResolvedValue(new Response("x", { status: 200, headers: { "content-type": "image/png" } }));

    const resposta = await chamar(["avatars", "a.png"]);

    expect(JSON.stringify([...resposta.headers])).not.toContain("backend.interno");
  });

  it("SVG ou HTML guardado no storage é entregue como download, não interpretado", async () => {
    fetchFalso.mockResolvedValue(new Response("<svg onload=alert(1)>", { status: 200, headers: { "content-type": "image/svg+xml" } }));

    const resposta = await chamar(["avatars", "x.svg"]);

    expect(resposta.headers.get("content-type")).toBe("application/octet-stream");
    expect(resposta.headers.get("content-disposition")).toBe("attachment");
  });

  it.each([[[".."]], [["avatars", "..", "..", "etc", "passwd"]], [["a%2fb"]], [[]]])("caminho inválido %j → 404 sem chamar o backend", async (caminho) => {
    const resposta = await chamar(caminho as string[]);

    expect(resposta.status).toBe(404);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("o navegador não consegue escolher o host: um segmento com cara de URL é recusado", async () => {
    for (const segmento of ["http:", "//evil.example", "evil.example:80"]) {
      const resposta = await chamar(["avatars", segmento]);

      expect(resposta.status, segmento).toBe(404);
    }

    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("redirecionamento do backend NÃO é seguido (502)", async () => {
    fetchFalso.mockResolvedValue(new Response(null, { status: 302, headers: { location: "http://evil.example/x" } }));

    expect((await chamar(["avatars", "a.png"])).status).toBe(502);
  });

  it("304 (cache) e 404 do backend são repassados", async () => {
    fetchFalso.mockResolvedValueOnce(new Response(null, { status: 304, headers: { etag: '"v1"' } }));
    expect((await chamar(["avatars", "a.png"])).status).toBe(304);

    fetchFalso.mockResolvedValueOnce(new Response("nao", { status: 404, headers: { "content-type": "text/html" } }));
    const nao = await chamar(["avatars", "b.png"]);
    expect(nao.status).toBe(404);
    expect(nao.headers.get("content-disposition")).toBe("attachment");
  });

  it("backend fora do ar ou lento (erro de rede/timeout) → 502, sem vazar detalhes", async () => {
    fetchFalso.mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.5:8080"));

    const resposta = await chamar(["avatars", "a.png"]);

    expect(resposta.status).toBe(502);
    expect(await resposta.text()).toBe("");
  });

  it("sem BACKEND_URL configurada → 502", async () => {
    vi.stubEnv("BACKEND_URL", "");

    expect((await chamar(["avatars", "a.png"])).status).toBe(502);
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
