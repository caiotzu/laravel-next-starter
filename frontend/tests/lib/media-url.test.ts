import { describe, expect, it } from "vitest";

import { normalizarUrlDeMidia, normalizarUrlsDeMidia } from "@/lib/media-url";

describe("normalizarUrlDeMidia", () => {
  it("converte URL absoluta de /storage em caminho relativo", () => {
    expect(normalizarUrlDeMidia("http://localhost/storage/avatars/a.png")).toBe("/storage/avatars/a.png");
    expect(normalizarUrlDeMidia("https://api.exemplo.com:8443/storage/banners/b.jpg?v=2")).toBe(
      "/storage/banners/b.jpg?v=2"
    );
  });

  it("mantém caminho já relativo, blob e data", () => {
    expect(normalizarUrlDeMidia("/storage/a.png")).toBe("/storage/a.png");
    expect(normalizarUrlDeMidia("blob:http://x/123")).toBe("blob:http://x/123");
    expect(normalizarUrlDeMidia("data:image/png;base64,AAA")).toBe("data:image/png;base64,AAA");
  });

  it("não altera URLs que não apontam para /storage", () => {
    expect(normalizarUrlDeMidia("https://site.com/promocao")).toBe("https://site.com/promocao");
    expect(normalizarUrlDeMidia("http://localhost/api/anexos/1?signature=abc")).toBe(
      "http://localhost/api/anexos/1?signature=abc"
    );
    expect(normalizarUrlDeMidia("texto qualquer")).toBe("texto qualquer");
  });

  it("preserva null, undefined e string vazia", () => {
    expect(normalizarUrlDeMidia(null)).toBeNull();
    expect(normalizarUrlDeMidia(undefined)).toBeUndefined();
    expect(normalizarUrlDeMidia("")).toBe("");
  });
});

describe("normalizarUrlsDeMidia", () => {
  it("percorre objetos e arrays aninhados normalizando só /storage", () => {
    const entrada = {
      status: 200,
      data: {
        data: {
          avatar: "http://localhost/storage/avatars/a.png",
          imagens: [{ id: "1", url: "http://localhost/storage/banners/1.png", ordem: 1 }],
          links: [{ url: "https://externo.com/x" }],
          nulo: null,
        },
      },
    };

    expect(normalizarUrlsDeMidia(entrada)).toEqual({
      status: 200,
      data: {
        data: {
          avatar: "/storage/avatars/a.png",
          imagens: [{ id: "1", url: "/storage/banners/1.png", ordem: 1 }],
          links: [{ url: "https://externo.com/x" }],
          nulo: null,
        },
      },
    });
  });

  it("não muta o objeto original e aceita primitivos", () => {
    const original = { avatar: "http://h/storage/a.png" };
    normalizarUrlsDeMidia(original);
    expect(original.avatar).toBe("http://h/storage/a.png");
    expect(normalizarUrlsDeMidia(10)).toBe(10);
    expect(normalizarUrlsDeMidia(true)).toBe(true);
  });
});
