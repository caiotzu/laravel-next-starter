import { describe, expect, it } from "vitest";

import { toBanner as toBannerAdmin } from "@/domains/admin/banner/mappers/banner.mapper";
import { toBanner as toBannerPrivate } from "@/domains/private/banner/mappers/banner.mapper";

describe("banner mapper (private)", () => {
  it("ordena imagens por ordem e mapeia links", () => {
    const r = toBannerPrivate({
      id: "1",
      titulo: "T",
      conteudo: "C",
      imagens: [
        { id: "b", url: "/storage/b.png", ordem: 2 },
        { id: "a", url: "/storage/a.png", ordem: 1 },
      ],
      links: [{ id: "l", nome: "Ver", url: "https://x.com" }],
    } as never);

    expect(r.imagens.map((i) => i.id)).toEqual(["a", "b"]);
    expect(r.links).toEqual([{ id: "l", nome: "Ver", url: "https://x.com" }]);
  });

  it("tolera imagens e links ausentes", () => {
    const r = toBannerPrivate({ id: "1", titulo: "T", conteudo: null } as never);
    expect(r.imagens).toEqual([]);
    expect(r.links).toEqual([]);
  });
});

describe("banner mapper (admin)", () => {
  it("converte snake_case para camelCase e ordena", () => {
    const r = toBannerAdmin({
      id: "1",
      titulo: "T",
      conteudo: "C",
      status: "ativo",
      status_label: "Ativo",
      direcionamento: { tipo: "todos", tipo_label: "Todos", entidade_tipo: null },
      inicio_em: "2026-01-01",
      fim_em: null,
      imagens: [
        { id: "b", url: "u2", ordem: 2 },
        { id: "a", url: "u1", ordem: 1 },
      ],
      links: [
        { id: "2", nome: "B", url: "y", ordem: 2 },
        { id: "1", nome: "A", url: "x", ordem: 1 },
      ],
      total_imagens: 2,
      updated_at: "u",
      created_at: "c",
      deleted_at: null,
    } as never);

    expect(r.statusLabel).toBe("Ativo");
    expect(r.direcionamento).toEqual({ tipo: "todos", tipoLabel: "Todos", entidadeTipo: null });
    expect(r.imagens.map((i) => i.id)).toEqual(["a", "b"]);
    expect(r.links.map((l) => l.id)).toEqual(["1", "2"]);
    expect(r.totalImagens).toBe(2);
    expect(r.inicioEm).toBe("2026-01-01");
  });
});
