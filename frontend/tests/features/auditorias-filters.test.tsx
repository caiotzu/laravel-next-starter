/**
 * AuditoriasFilters: os itens selecionados nos campos "Registro" e "Usuário" são sincronizados
 * com os filtros (ex.: vindos da URL) assim que a lista correspondente chega. Essa sincronização
 * foi refatorada na FRONT-003 (de useEffect para ajuste durante a renderização).
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const registros = vi.hoisted(() => ({ data: undefined as { id: string; label: string }[] | undefined, isLoading: false }));
const hookRegistros = vi.hoisted(() => vi.fn());

vi.mock("@/domains/admin/auditoria/hooks/useAuditoriaEntidadeRegistros", () => ({
  useAuditoriaEntidadeRegistros: (...args: unknown[]) => {
    hookRegistros(...args);
    return registros;
  },
}));
vi.mock("@/hooks/use-debounce", () => ({ useDebouncedValue: (valor: unknown) => valor }));

import { AuditoriasFilters } from "@/features/admin/auditoria/components/AuditoriasFilters";

type Filtros = Parameters<typeof AuditoriasFilters>[0]["filters"];

const usuarios = [
  { id: "u1", label: "Maria" },
  { id: "u2", label: "João" },
];
const entidades = [{ value: "empresas", label: "Empresas" }];

const filtrosBase = { page: 3, por_pagina: 10, incluir_dependentes: false } as Filtros;

function montar(filters: Partial<Filtros> = {}, lista = usuarios) {
  const atuais = { ...filtrosBase, ...filters } as Filtros;
  const gravados: Filtros[] = [];
  // Como o React, executa o updater (`prev => ...`) na hora do evento; assim o valor do campo
  // lido dentro dele ainda é o que o usuário acabou de digitar.
  const setFilters = vi.fn((valor: Filtros | ((prev: Filtros) => Filtros)) => {
    gravados.push(typeof valor === "function" ? valor(atuais) : valor);
  });
  const props = (f: Partial<Filtros>, l = lista) => ({
    filters: { ...filtrosBase, ...f } as Filtros,
    setFilters,
    usuarios: l,
    isLoadingUsuarios: false,
    entidades,
  });
  const resultado = render(<AuditoriasFilters {...props(filters)} />);

  return {
    setFilters,
    ultimoFiltro: () => gravados.at(-1),
    rerender: (f: Partial<Filtros>, l = lista) => resultado.rerender(<AuditoriasFilters {...props(f, l)} />),
  };
}

const campo = (placeholder: string) => screen.getByPlaceholderText(placeholder) as HTMLInputElement;
const CAMPO_USUARIO = "Digite o nome ou ID para pesquisar...";
const CAMPO_REGISTRO = "Digite o nome/descrição ou ID para pesquisar...";

/** Abre a lista do campo e devolve as opções com o estado de seleção. */
async function opcoes(placeholder: string) {
  await userEvent.click(campo(placeholder));
  return screen.getAllByRole("option").map((o) => ({ texto: o.textContent, selecionado: o.getAttribute("aria-selected") === "true" }));
}

beforeEach(() => {
  registros.data = undefined;
  registros.isLoading = false;
  hookRegistros.mockClear();
});

describe("AuditoriasFilters: seleção sincronizada com os filtros", () => {
  it("marca o usuário que está nos filtros (ex.: vindo da URL) assim que a lista contém o item", async () => {
    montar({ usuario_id: "u1", usuario_nome: "Maria" });

    expect(await opcoes(CAMPO_USUARIO)).toEqual([
      { texto: "Maria", selecionado: true },
      { texto: "João", selecionado: false },
    ]);
  });

  it("marca o registro da entidade quando a lista de registros chega depois da tela", async () => {
    registros.data = undefined; // a lista ainda não chegou
    const { rerender } = montar({ entidade_tabela: "empresas", entidade_id: "e2", entidade_nome: "Empresa Beta" });

    registros.data = [
      { id: "e1", label: "Empresa Alfa" },
      { id: "e2", label: "Empresa Beta" },
    ];
    rerender({ entidade_tabela: "empresas", entidade_id: "e2", entidade_nome: "Empresa Beta" });

    expect(await opcoes(CAMPO_REGISTRO)).toEqual([
      { texto: "Empresa Alfa", selecionado: false },
      { texto: "Empresa Beta", selecionado: true },
    ]);
  });

  it("não seleciona nada (e não quebra) quando o id dos filtros não existe na lista", async () => {
    montar({ usuario_id: "inexistente", usuario_nome: "Fulano" });

    expect(await opcoes(CAMPO_USUARIO)).toEqual([
      { texto: "Maria", selecionado: false },
      { texto: "João", selecionado: false },
    ]);
  });

  it("sem usuario_id nos filtros, nenhum usuário vem marcado", async () => {
    montar();

    expect((await opcoes(CAMPO_USUARIO)).some((o) => o.selecionado)).toBe(false);
  });
});

describe("AuditoriasFilters: busca de registros", () => {
  it("só consulta a API quando há texto digitado (selecionar a entidade sozinha não dispara consulta)", () => {
    montar({ entidade_tabela: "empresas", entidade_nome: "" });
    expect(hookRegistros).toHaveBeenLastCalledWith("empresas", { busca: "", por_pagina: 10 }, { enabled: false });

    hookRegistros.mockClear();
    montar({ entidade_tabela: "empresas", entidade_nome: "Alfa" });
    expect(hookRegistros).toHaveBeenLastCalledWith("empresas", { busca: "Alfa", por_pagina: 10 }, { enabled: true });
  });

  it("o campo Registro fica desabilitado enquanto nenhuma entidade é escolhida", () => {
    montar({ entidade_tabela: "" });
    expect(campo(CAMPO_REGISTRO)).toBeDisabled();

    montar({ entidade_tabela: "empresas" });
    expect(screen.getAllByPlaceholderText(CAMPO_REGISTRO).at(-1)).toBeEnabled();
  });
});

describe("AuditoriasFilters: alteração dos filtros", () => {
  it("escolher um usuário na lista grava id e nome e volta para a página 1", async () => {
    const { ultimoFiltro } = montar();

    await userEvent.click(campo(CAMPO_USUARIO));
    await userEvent.click(screen.getByRole("option", { name: "João" }));

    expect(ultimoFiltro()).toMatchObject({ usuario_id: "u2", usuario_nome: "João", page: 1 });
  });

  it("digitar no campo Usuário limpa o id selecionado e atualiza o texto da busca", async () => {
    const { ultimoFiltro } = montar({ usuario_id: "u1", usuario_nome: "Mari" });

    await userEvent.type(campo(CAMPO_USUARIO), "a");

    expect(ultimoFiltro()).toMatchObject({ usuario_id: "", usuario_nome: "Maria", page: 1 });
  });

  it("alterar datas volta para a página 1", async () => {
    const { ultimoFiltro } = montar();
    const [inicio] = document.querySelectorAll<HTMLInputElement>("input[type='date']");

    await userEvent.type(inicio, "2026-01-15");

    expect(ultimoFiltro()).toMatchObject({ data_inicio: "2026-01-15", page: 1 });
  });

  it("o interruptor Incluir dependentes alterna o filtro e volta para a página 1", async () => {
    const { ultimoFiltro } = montar();

    await userEvent.click(screen.getByRole("switch", { name: "Incluir dependentes" }));

    expect(ultimoFiltro()).toMatchObject({ incluir_dependentes: true, page: 1 });
  });
});
