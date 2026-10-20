import { beforeEach, describe, expect, it, vi } from "vitest";

const privateReq = vi.fn();
const adminReq = vi.fn();
vi.mock("@/lib/proxy-private", () => ({ proxyPrivateRequest: (...a: unknown[]) => privateReq(...a) }));
vi.mock("@/lib/proxy-admin", () => ({ proxyAdminRequest: (...a: unknown[]) => adminReq(...a) }));

import * as empresaAdmin from "@/domains/admin/empresa/services/empresaService";
import * as grupoAdmin from "@/domains/admin/grupo/services/grupoService";
import * as usuarioAdmin from "@/domains/admin/usuario/services/usuarioService";
import * as empresaPrivate from "@/domains/private/empresa/services/empresaService";
import * as grupoPrivate from "@/domains/private/grupo/services/grupoService";
import * as usuarioPrivate from "@/domains/private/usuario/services/usuarioService";

const usuarioApi = {
  id: "u1", grupo_id: "g1", nome: "Maria", email: "maria@exemplo.com", status: "ativo", avatar: null,
  google2fa_enable: true, google2fa_confirmado_em: null, ultimo_login_em: null, ultimo_ip: null,
  created_at: "2026-01-01", updated_at: "2026-01-02", deleted_at: null,
};
const grupoApi = { id: "g1", descricao: "Financeiro", created_at: "c", updated_at: "u", deleted_at: null };
const empresaApi = {
  id: "e1", grupo_empresa_id: "ge1", matriz_id: null, cnpj: "12345678000195", nome_fantasia: "Fantasia",
  razao_social: "Razão", inscricao_estadual: null, inscricao_municipal: null, status: "ativo", uf: "SP",
  created_at: "c", updated_at: "u", deleted_at: null,
};

/** Resposta do proxy no formato `{ status, data }` (o corpo da API fica em `data`). */
const resposta = (corpo: unknown) => ({ status: 200, data: corpo });

type Contexto = { nome: string; prefixo: string; chamada: typeof adminReq; outra: typeof privateReq };
const contextos: Contexto[] = [
  { nome: "admin", prefixo: "/admin", chamada: adminReq, outra: privateReq },
  { nome: "private", prefixo: "", chamada: privateReq, outra: adminReq },
];

beforeEach(() => {
  privateReq.mockReset().mockResolvedValue(resposta({ data: [] }));
  adminReq.mockReset().mockResolvedValue(resposta({ data: [] }));
});

describe.each([
  { ...contextos[0], usuario: usuarioAdmin, grupo: grupoAdmin },
  { ...contextos[1], usuario: usuarioPrivate, grupo: grupoPrivate },
])("services de usuário e grupo ($nome)", ({ prefixo, chamada, outra, usuario, grupo }) => {
  it("cadastrarUsuario: POST com o corpo e devolve o usuário mapeado para camelCase", async () => {
    chamada.mockResolvedValue(resposta({ data: usuarioApi }));

    const criado = await usuario.cadastrarUsuario({ nome: "Maria", email: "maria@exemplo.com", grupo_id: "g1" } as never);

    expect(chamada).toHaveBeenCalledWith({
      url: `${prefixo}/usuarios`,
      method: "POST",
      data: { nome: "Maria", email: "maria@exemplo.com", grupo_id: "g1" },
    });
    expect(criado).toMatchObject({ id: "u1", grupoId: "g1", google2faEnable: true, ultimoLoginEm: null });
    expect(criado.grupo).toBeUndefined();
    expect(outra).not.toHaveBeenCalled();
  });

  it("editarUsuario, ativarUsuario e excluirUsuario usam o método e a URL certos", async () => {
    chamada.mockResolvedValue(resposta({ data: usuarioApi }));

    await usuario.editarUsuario("u1", { nome: "Novo" } as never);
    await usuario.ativarUsuario("u1");
    await usuario.excluirUsuario("u1");

    expect(chamada.mock.calls.map(([c]) => `${c.method} ${c.url}`)).toEqual([
      `PUT ${prefixo}/usuarios/u1`,
      `PATCH ${prefixo}/usuarios/u1/ativar`,
      `DELETE ${prefixo}/usuarios/u1`,
    ]);
    expect(chamada.mock.calls[0][0].data).toEqual({ nome: "Novo" });
  });

  it("listarUsuarios: monta a query sem campos vazios, nulos ou indefinidos e mapeia cada item", async () => {
    chamada.mockResolvedValue(resposta({ data: [usuarioApi], meta: { total: 1 } }));

    const lista = await usuario.listarUsuarios({ page: 2, busca: "", status: undefined, grupo_id: "g1", nome: null } as never);

    expect(chamada).toHaveBeenCalledWith({ url: `${prefixo}/usuarios?page=2&grupo_id=g1`, method: "GET" });
    expect(lista.data[0]).toMatchObject({ id: "u1", nome: "Maria" });
    expect(lista).toMatchObject({ meta: { total: 1 } });
  });

  it("grupo: cadastrar, editar, ativar, excluir e visualizar", async () => {
    chamada.mockResolvedValue(resposta({ data: grupoApi }));

    const criado = await grupo.cadastrarGrupo({ descricao: "Financeiro" } as never);
    await grupo.editarGrupo("g1", { descricao: "Novo" } as never);
    await grupo.ativarGrupo("g1");
    await grupo.excluirGrupo("g1");
    const visto = await grupo.visualizarGrupo("g1");

    expect(chamada.mock.calls.map(([c]) => `${c.method} ${c.url}`)).toEqual([
      `POST ${prefixo}/grupos`,
      `PUT ${prefixo}/grupos/g1`,
      `PATCH ${prefixo}/grupos/g1/ativar`,
      `DELETE ${prefixo}/grupos/g1`,
      `GET ${prefixo}/grupos/g1`,
    ]);
    // sem `versao`, `usuarios` ou `permissoes` na resposta, o mapper usa valores seguros
    expect(criado).toMatchObject({ id: "g1", descricao: "Financeiro", versao: 0, usuarios: [], permissoes: [] });
    expect(visto.id).toBe("g1");
  });

  it("grupo: mapeia usuários e permissões aninhados", async () => {
    chamada.mockResolvedValue(
      resposta({
        data: {
          ...grupoApi,
          versao: 3,
          usuarios: [usuarioApi],
          permissoes: [{ id: "p1", chave: "admin.grupo.listar", descricao: "Listar", created_at: "c", updated_at: "u", deleted_at: null }],
        },
      })
    );

    const visto = await grupo.visualizarGrupo("g1");

    expect(visto.versao).toBe(3);
    expect(visto.usuarios[0]).toMatchObject({ nome: "Maria", grupoId: "g1" });
    expect(visto.permissoes[0]).toMatchObject({ chave: "admin.grupo.listar" });
  });

  it("listarGrupos serializa a query e mapeia os itens", async () => {
    chamada.mockResolvedValue(resposta({ data: [grupoApi] }));

    const lista = await grupo.listarGrupos({ page: 1, descricao: "Fin", por_pagina: "" } as never);

    expect(chamada).toHaveBeenCalledWith({ url: `${prefixo}/grupos?page=1&descricao=Fin`, method: "GET" });
    expect(lista.data[0].descricao).toBe("Financeiro");
  });
});

describe("services de empresa", () => {
  it("admin: cadastrar, editar, visualizar e listar", async () => {
    adminReq.mockResolvedValue(resposta({ data: empresaApi }));

    const criada = await empresaAdmin.cadastrarEmpresa({ cnpj: "12345678000195" } as never);
    await empresaAdmin.editarEmpresa("e1", { nome_fantasia: "Nova" } as never);
    await empresaAdmin.visualizarEmpresa("e1");

    adminReq.mockResolvedValue(resposta({ data: [empresaApi] }));
    const lista = await empresaAdmin.listarEmpresas({ page: 3, busca: "" } as never);

    expect(adminReq.mock.calls.map(([c]) => `${c.method} ${c.url}`)).toEqual([
      "POST /admin/empresas",
      "PUT /admin/empresas/e1",
      "GET /admin/empresas/e1",
      "GET /admin/empresas?page=3",
    ]);
    expect(criada).toMatchObject({ id: "e1", grupoEmpresaId: "ge1", nomeFantasia: "Fantasia", razaoSocial: "Razão", contatos: [], enderecos: [] });
    expect(lista.data[0].cnpj).toBe("12345678000195");
    expect(privateReq).not.toHaveBeenCalled();
  });

  it("empresa mapeia matriz, grupo da empresa, contatos e endereços aninhados", async () => {
    adminReq.mockResolvedValue(
      resposta({
        data: {
          ...empresaApi,
          matriz: { ...empresaApi, id: "m1", nome_fantasia: "Matriz" },
          grupo_empresa: { id: "ge1", nome: "Grupo", created_at: "c", updated_at: "u", deleted_at: null },
        },
      })
    );

    const vista = await empresaAdmin.visualizarEmpresa("e1");

    expect(vista.matriz).toMatchObject({ id: "m1", nomeFantasia: "Matriz" });
    expect(vista.grupoEmpresa).toMatchObject({ id: "ge1" });
  });

  it("private: só edita, visualiza e lista pelas rotas sem prefixo /admin", async () => {
    privateReq.mockResolvedValue(resposta({ data: empresaApi }));

    await empresaPrivate.editarEmpresa("e1", { nome_fantasia: "Nova" } as never);
    await empresaPrivate.visualizarEmpresa("e1");
    privateReq.mockResolvedValue(resposta({ data: [empresaApi] }));
    await empresaPrivate.listarEmpresas({ page: 1 } as never);

    expect(privateReq.mock.calls.map(([c]) => `${c.method} ${c.url}`)).toEqual([
      "PUT /empresas/e1",
      "GET /empresas/e1",
      "GET /empresas?page=1",
    ]);
    expect(adminReq).not.toHaveBeenCalled();
  });

  it("private NÃO expõe cadastrar, excluir nem ativar empresa (o cliente não cria nem remove empresas)", () => {
    const exportados = Object.keys(empresaPrivate);

    expect(exportados.sort()).toEqual(["editarEmpresa", "listarEmpresas", "visualizarEmpresa"]);
  });
});
