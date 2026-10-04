import { describe, expect, it } from "vitest";

import { esqueceuSenhaSchema } from "@/lib/validations/auth/esqueceu-senha-schema";
import { loginSchema } from "@/lib/validations/auth/login-schema";
import { primeiroAcessoSchema } from "@/lib/validations/auth/primeiro-acesso-schema";
import { redefinirSenhaSchema } from "@/lib/validations/auth/redefinir-senha-schema";
import { createStrongPasswordSchema, getPasswordRequirements } from "@/lib/validations/password";

describe("getPasswordRequirements", () => {
  it("avalia cada requisito", () => {
    expect(getPasswordRequirements("abc")).toEqual({ length: false, upper: false, lower: true, number: false, special: false });
    expect(getPasswordRequirements("Abcdef1!")).toEqual({ length: true, upper: true, lower: true, number: true, special: true });
  });
});

describe("createStrongPasswordSchema", () => {
  const schema = createStrongPasswordSchema("A senha");

  it("aceita senha forte", () => {
    expect(schema.safeParse("Abcdef1!").success).toBe(true);
  });

  it.each([
    ["Abc1!", "no mínimo 8"],
    ["abcdefg1!", "maiúscula"],
    ["ABCDEFG1!", "minúscula"],
    ["Abcdefgh!", "número"],
    ["Abcdefg12", "especial"],
  ])("rejeita %s", (senha, trecho) => {
    const r = schema.safeParse(senha);
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.message).join(" ")).toContain(trecho);
  });
});

describe("schemas de autenticação", () => {
  it("login", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", senha: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "invalido", senha: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.com", senha: "" }).success).toBe(false);
  });

  it("esqueceu senha", () => {
    expect(esqueceuSenhaSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
    expect(esqueceuSenhaSchema.safeParse({ email: "" }).success).toBe(false);
  });

  it.each([
    ["primeiro acesso", primeiroAcessoSchema],
    ["redefinir senha", redefinirSenhaSchema],
  ])("%s exige senha forte e confirmação igual", (_nome, schema) => {
    expect(schema.safeParse({ senha: "Abcdef1!", senha_confirma: "Abcdef1!" }).success).toBe(true);

    const diferente = schema.safeParse({ senha: "Abcdef1!", senha_confirma: "Outra1!aa" });
    expect(diferente.success).toBe(false);
    expect(diferente.error?.issues[0].path).toEqual(["senha_confirma"]);
    expect(diferente.error?.issues[0].message).toBe("As senhas não conferem");

    expect(schema.safeParse({ senha: "fraca", senha_confirma: "fraca" }).success).toBe(false);
    expect(schema.safeParse({ senha: "Abcdef1!", senha_confirma: "" }).success).toBe(false);
  });
});
