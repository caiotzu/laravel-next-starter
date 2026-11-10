import { describe, expect, it } from "vitest";

import { z } from "@/lib/zod";

/**
 * FRONT-005: nenhuma mensagem de validação pode chegar ao usuário em inglês. O zod só usa a
 * mensagem padrão quando o schema não define a própria, e é isso que este arquivo cobre.
 */
function mensagens(schema: z.ZodType, valor: unknown): Record<string, string> {
  const resultado = schema.safeParse(valor);

  if (resultado.success) return {};

  return Object.fromEntries(resultado.error.issues.map((i) => [i.path.join("."), i.message]));
}

const ingles = /invalid|expected|received|too small|too big|must|required/i;

describe("lib/zod — mensagens padrão em português (FRONT-005)", () => {
  const schema = z.object({
    nome: z.string().min(3),
    idade: z.number().min(18).max(120),
    email: z.string().email(),
    tipo: z.enum(["a", "b"]),
    ativo: z.boolean(),
    itens: z.array(z.string()).min(1),
    codigo: z.string().regex(/^\d+$/),
    obs: z.string().max(5),
  });

  it("campo ausente vira \"Campo obrigatório.\" (em vez de \"expected string, received undefined\")", () => {
    const m = mensagens(schema, {});

    expect(m.nome).toBe("Campo obrigatório.");
    expect(m.idade).toBe("Campo obrigatório.");
    expect(m.email).toBe("Campo obrigatório.");
    expect(m.ativo).toBe("Campo obrigatório.");
    expect(m.itens).toBe("Campo obrigatório.");
    expect(m.codigo).toBe("Campo obrigatório.");
  });

  it("campo nulo também é \"obrigatório\"", () => {
    expect(mensagens(z.object({ nome: z.string() }), { nome: null }).nome).toBe("Campo obrigatório.");
  });

  it("tipo errado vira \"Valor inválido.\"", () => {
    expect(mensagens(z.object({ idade: z.number() }), { idade: "abc" }).idade).toBe("Valor inválido.");
  });

  it("tamanho, faixa, lista, e-mail, opção e formato", () => {
    const m = mensagens(schema, {
      nome: "ab",
      idade: 10,
      email: "x",
      tipo: "c",
      ativo: true,
      itens: [],
      codigo: "abc",
      obs: "123456",
    });

    expect(m.nome).toBe("Informe no mínimo 3 caracteres.");
    expect(m.idade).toBe("O valor mínimo é 18.");
    expect(m.email).toBe("Informe um e-mail válido.");
    expect(m.tipo).toBe("Selecione uma opção válida.");
    expect(m.itens).toBe("Selecione ao menos uma opção.");
    expect(m.codigo).toBe("Formato inválido.");
    expect(m.obs).toBe("Informe no máximo 5 caracteres.");
  });

  it("máximos de número e de lista", () => {
    const s = z.object({ n: z.number().max(10), l: z.array(z.string()).max(2) });
    const m = mensagens(s, { n: 11, l: ["a", "b", "c"] });

    expect(m.n).toBe("O valor máximo é 10.");
    expect(m.l).toBe("Selecione no máximo 2 opções.");
  });

  it("string vazia com min(1) é \"Campo obrigatório.\"", () => {
    expect(mensagens(z.object({ nome: z.string().min(1) }), { nome: "" }).nome).toBe("Campo obrigatório.");
  });

  it("a mensagem escrita no schema continua valendo", () => {
    const s = z.object({ nome: z.string().min(3, "Nome curto demais"), cpf: z.string({ error: "Informe o CPF" }) });
    const m = mensagens(s, { nome: "a" });

    expect(m.nome).toBe("Nome curto demais");
    expect(m.cpf).toBe("Informe o CPF");
  });

  it("o que não tem mensagem própria cai na tradução oficial em português, nunca em inglês", () => {
    const s = z.object({ n: z.number().gt(5) }).strict();
    const m = mensagens(s, { n: 5, extra: 1 });

    for (const texto of Object.values(m)) expect(texto).not.toMatch(ingles);
  });

  it("nenhuma mensagem do conjunto comum contém inglês", () => {
    const todas = [
      mensagens(schema, {}),
      mensagens(schema, { nome: "a", idade: "x", email: 1, tipo: 2, ativo: "s", itens: 3, codigo: 4, obs: 5 }),
      mensagens(schema, { nome: "a", idade: 1, email: "x", tipo: "c", ativo: true, itens: [], codigo: "a", obs: "xxxxxxx" }),
    ];

    for (const grupo of todas) {
      for (const texto of Object.values(grupo)) expect(texto).not.toMatch(ingles);
    }
  });
});
