import { describe, expect, it } from "vitest";
import type { ZodType } from "zod";

import { empresaSchemaCadastro, empresaSchemaEdicao as empresaEdicaoAdmin } from "@/features/admin/empresa/schemas/empresa.schema";
import { empresaContatoSchema as contatoAdmin } from "@/features/admin/empresa-contato/schemas/empresa-contato.schema";
import { empresaEnderecoSchema as enderecoAdmin } from "@/features/admin/empresa-endereco/schemas/empresa-endereco.schema";
import { grupoSchemaCadastro as grupoCadastroAdmin, grupoSchemaEdicao as grupoEdicaoAdmin } from "@/features/admin/grupo/schemas/grupo.schema";
import { grupoEmpresaSchemaCadastro, grupoEmpresaSchemaEdicao } from "@/features/admin/grupo-empresa/schemas/grupoEmpresa.schema";
import { usuarioGrupoEmpresaSchemaAlteraStatus } from "@/features/admin/grupo-empresa/schemas/usuarioGrupoEmpresa.schema";
import { usuarioSchemaCadastro as usuarioCadastroAdmin, usuarioSchemaEdicao as usuarioEdicaoAdmin } from "@/features/admin/usuario/schemas/usuario.schema";
import { empresaSchemaEdicao as empresaEdicaoPrivate } from "@/features/private/empresa/schemas/empresa.schema";
import { empresaContatoSchema as contatoPrivate } from "@/features/private/empresa-contato/schemas/empresa-contato.schema";
import { empresaEnderecoSchema as enderecoPrivate } from "@/features/private/empresa-endereco/schemas/empresa-endereco.schema";
import { grupoSchemaCadastro as grupoCadastroPrivate, grupoSchemaEdicao as grupoEdicaoPrivate } from "@/features/private/grupo/schemas/grupo.schema";
import { usuarioSchemaCadastro as usuarioCadastroPrivate, usuarioSchemaEdicao as usuarioEdicaoPrivate } from "@/features/private/usuario/schemas/usuario.schema";

/** Mensagens de erro de um parse, no formato "campo: mensagem". */
function erros(schema: ZodType, dados: unknown): string[] {
  const resultado = schema.safeParse(dados);
  return resultado.success ? [] : resultado.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

const GRUPO_ID = "550e8400-e29b-41d4-a716-446655440000";

describe.each([
  ["admin", usuarioCadastroAdmin, usuarioEdicaoAdmin],
  ["private", usuarioCadastroPrivate, usuarioEdicaoPrivate],
])("schemas de usuário (%s)", (_contexto, cadastro, edicao) => {
  const valido = { nome: "Maria", email: "maria@exemplo.com", grupo_id: GRUPO_ID };

  it("aceita um cadastro válido", () => {
    expect(erros(cadastro, valido)).toEqual([]);
  });

  it("exige nome, e-mail válido e um grupo (uuid) selecionado", () => {
    expect(erros(cadastro, { nome: "", email: "invalido", grupo_id: "nao-e-uuid" })).toEqual([
      "nome: O nome do usuário é obrigatório",
      "email: E-mail inválido",
      "grupo_id: Grupo inválido ou não selecionado",
    ]);
  });

  it("na edição o status é opcional, mas não pode ser vazio quando enviado", () => {
    expect(erros(edicao, valido)).toEqual([]);
    expect(erros(edicao, { ...valido, status: "ativo" })).toEqual([]);
    expect(erros(edicao, { ...valido, status: "" })).toEqual(["status: O status/situação do usuário é obrigatório"]);
  });
});

describe.each([
  ["admin", grupoCadastroAdmin, grupoEdicaoAdmin],
  ["private", grupoCadastroPrivate, grupoEdicaoPrivate],
])("schemas de grupo (%s)", (_contexto, cadastro, edicao) => {
  it("exige a descrição", () => {
    expect(erros(cadastro, { descricao: "Financeiro" })).toEqual([]);
    expect(erros(cadastro, { descricao: "" })).toEqual(["descricao: a descrição do grupo é obrigatório"]);
    expect(erros(edicao, {})).toHaveLength(1);
  });
});

describe("schemas de grupo-empresa (onboarding)", () => {
  it("o cadastro exige o nome da empresa e o usuário administrador (nome e e-mail)", () => {
    expect(erros(grupoEmpresaSchemaCadastro, { nome: "Nova", usuario: { nome: "Ana", email: "ana@nova.com" } })).toEqual([]);

    expect(erros(grupoEmpresaSchemaCadastro, { nome: "", usuario: { nome: "", email: "x" } })).toEqual([
      "nome: O nome do grupo é obrigatório",
      "usuario.nome: O nome do usuário é obrigatório",
      "usuario.email: E-mail inválido",
    ]);

    expect(erros(grupoEmpresaSchemaCadastro, { nome: "Sem usuario" })).toHaveLength(1);
  });

  it("a edição só pede o nome e a troca de status exige o status", () => {
    expect(erros(grupoEmpresaSchemaEdicao, { nome: "Renomeada" })).toEqual([]);
    expect(erros(usuarioGrupoEmpresaSchemaAlteraStatus, { status: "" })).toEqual(["status: O status/situação é obrigatório"]);
    expect(erros(usuarioGrupoEmpresaSchemaAlteraStatus, { status: "bloqueado" })).toEqual([]);
  });
});

describe("schemas de empresa", () => {
  const valida = {
    grupo_empresa_id: "g1",
    cnpj: "12.345.678/0001-95",
    nome_fantasia: "Fantasia",
    razao_social: "Razão Social LTDA",
    uf: "SP",
  };

  it("aceita CNPJ com máscara e também alfanumérico, desde que tenha 14 caracteres", () => {
    expect(erros(empresaSchemaCadastro, valida)).toEqual([]);
    expect(erros(empresaSchemaCadastro, { ...valida, cnpj: "12.ABC.345/01DE-35" })).toEqual([]);
  });

  it("rejeita CNPJ com tamanho errado, UF inexistente e campos obrigatórios vazios", () => {
    expect(erros(empresaSchemaCadastro, { ...valida, cnpj: "12.345.678/0001-9" })).toEqual(["cnpj: O CNPJ deve conter 14 dígitos"]);
    expect(erros(empresaSchemaCadastro, { ...valida, uf: "XX" })).toEqual(["uf: A UF é obrigatória"]);
    expect(erros(empresaSchemaCadastro, { ...valida, grupo_empresa_id: "", nome_fantasia: "", razao_social: "" })).toEqual([
      "grupo_empresa_id: O grupo da empresa é obrigatório",
      "nome_fantasia: O nome fantasia é obrigatório",
      "razao_social: A razao social é obrigatória",
    ]);
  });

  it("Admin: na edição o grupo é opcional; inscrições e matriz são opcionais", () => {
    const { grupo_empresa_id: _g, ...semGrupo } = valida;

    expect(erros(empresaEdicaoAdmin, semGrupo)).toEqual([]);
    expect(erros(empresaEdicaoAdmin, { ...semGrupo, matriz_id: "m1", inscricao_estadual: "1", inscricao_municipal: "2" })).toEqual([]);
  });

  it("Private: a edição NÃO repassa cnpj nem grupo_empresa_id (o cliente não pode alterá-los)", () => {
    const resultado = empresaEdicaoPrivate.safeParse({ ...valida, status: "ativo" });

    expect(resultado.success).toBe(true);
    expect(resultado.data).not.toHaveProperty("cnpj");
    expect(resultado.data).not.toHaveProperty("grupo_empresa_id");
    expect(resultado.data).toMatchObject({ nome_fantasia: "Fantasia", uf: "SP", status: "ativo" });
  });
});

describe.each([
  ["admin", contatoAdmin],
  ["private", contatoPrivate],
])("schema de contato da empresa (%s)", (_contexto, schema) => {
  const base = { principal: false, ativo: true };

  it("tipo E exige e-mail válido", () => {
    expect(erros(schema, { ...base, tipo: "E", valor: "contato@empresa.com" })).toEqual([]);
    expect(erros(schema, { ...base, tipo: "E", valor: "sem-arroba" })).toEqual(["valor: Informe um e-mail valido"]);
  });

  it("tipo T exige telefone com 10 ou 11 dígitos, ignorando a máscara", () => {
    expect(erros(schema, { ...base, tipo: "T", valor: "(11) 98765-4321" })).toEqual([]);
    expect(erros(schema, { ...base, tipo: "T", valor: "(11) 3456-7890" })).toEqual([]);
    expect(erros(schema, { ...base, tipo: "T", valor: "1234" })).toEqual(["valor: Informe um telefone valido"]);
  });

  it("rejeita tipo desconhecido e valor vazio", () => {
    expect(erros(schema, { ...base, tipo: "X", valor: "qualquer" })).toEqual(["tipo: O tipo do contato e obrigatório"]);
    expect(erros(schema, { ...base, tipo: "E", valor: "" })[0]).toBe("valor: O valor do contato e obrigatório");
  });
});

describe.each([
  ["admin", enderecoAdmin],
  ["private", enderecoPrivate],
])("schema de endereço da empresa (%s)", (_contexto, schema) => {
  const valido = {
    tipo: "COMERCIAL",
    municipio_id: "m1",
    principal: true,
    ativo: true,
    cep: "01001-000",
    logradouro: "Rua A",
    numero: "10",
    bairro: "Centro",
  };

  it("aceita CEP com máscara; complemento é opcional", () => {
    expect(erros(schema, valido)).toEqual([]);
    expect(erros(schema, { ...valido, complemento: "Sala 2" })).toEqual([]);
  });

  it("rejeita CEP sem 8 dígitos, tipo desconhecido e campos obrigatórios vazios", () => {
    expect(erros(schema, { ...valido, cep: "0100" })).toEqual(["cep: O CEP deve conter 8 dígitos"]);
    expect(erros(schema, { ...valido, tipo: "OUTRO" })).toEqual(["tipo: O tipo do endereço e obrigatório"]);
    expect(erros(schema, { ...valido, municipio_id: "", logradouro: "", numero: "", bairro: "" })).toEqual([
      "municipio_id: O município e obrigatório",
      "logradouro: O logradouro e obrigatório",
      "numero: O numero e obrigatório",
      "bairro: O bairro e obrigatório",
    ]);
  });
});
