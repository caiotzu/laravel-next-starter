/**
 * TEST-005: MensagemFormCreate (Admin). Valida a regra "o destino obrigatório depende do
 * direcionamento" e o payload entregue a `onSubmit`.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const buscas = vi.hoisted(() => ({ grupos: vi.fn(), usuarios: vi.fn() }));

vi.mock("@/domains/admin/grupo-empresa/hooks/useGrupoEmpresas", () => ({
  useGrupoEmpresas: (params: unknown) => {
    buscas.grupos(params);

    return { data: { data: [{ id: "550e8400-e29b-41d4-a716-446655440000", nome: "Grupo Alfa" }] }, isLoading: false };
  },
}));
vi.mock("@/domains/admin/mensagem/hooks/useBuscarUsuariosMensagem", () => ({
  useBuscarUsuariosMensagem: (params: unknown) => {
    buscas.usuarios(params);

    return { data: { data: [{ id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8", nome: "Ana Silva", email: "ana@x.com" }] }, isLoading: false };
  },
}));

import { MensagemFormCreate } from "@/features/admin/mensagem/components/MensagemFormCreate";

const onSubmit = vi.fn();

beforeEach(() => onSubmit.mockReset().mockResolvedValue(undefined));

const montar = (props: Partial<Parameters<typeof MensagemFormCreate>[0]> = {}) =>
  render(<MensagemFormCreate onSubmit={onSubmit} {...props} />);

async function preencherTextos(titulo = "Manutenção", conteudo = "Sistema fora das 22h às 23h.") {
  await userEvent.type(screen.getByLabelText(/Título/), titulo);
  await userEvent.type(screen.getByLabelText(/Conteúdo/), conteudo);
}

describe("MensagemFormCreate", () => {
  it("renderiza título, conteúdo, os 4 direcionamentos e o botão; começa em Grupo de empresa", () => {
    montar();

    expect(screen.getByText("Enviar mensagem", { selector: '[data-slot="card-title"]' })).toBeInTheDocument();
    for (const nome of ["Geral", "Entidade", "Grupo de empresa", "Usuário"]) {
      expect(screen.getByRole("radio", { name: nome })).toBeInTheDocument();
    }
    expect(screen.getByRole("radio", { name: "Grupo de empresa" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Enviar mensagem" })).toBeEnabled();
  });

  it("enviar vazio mostra os erros de título e conteúdo e não envia", async () => {
    montar();

    await userEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByText("O título da mensagem é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("O conteúdo da mensagem é obrigatório")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("título com mais de 120 caracteres é recusado", async () => {
    montar();

    await userEvent.click(screen.getByLabelText(/Título/));
    await userEvent.paste("x".repeat(121));
    await userEvent.type(screen.getByLabelText(/Conteúdo/), "texto");
    await userEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByText("O título deve ter no máximo 120 caracteres")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("Grupo de empresa sem escolher o grupo: pede o destino", async () => {
    montar();
    await preencherTextos();

    await userEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByText("Selecione o grupo de empresa de destino")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("Geral: não exige destino, explica o alcance e envia", async () => {
    montar();
    await preencherTextos();

    await userEvent.click(screen.getByRole("radio", { name: "Geral" }));
    expect(screen.getByText("A mensagem será enviada para todos os usuários do sistema.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({ titulo: "Manutenção", conteudo: "Sistema fora das 22h às 23h.", direcionamento_tipo: "geral" })
    );
  });

  it("Entidade sem escolher a entidade: pede o destino", async () => {
    montar();
    await preencherTextos();

    await userEvent.click(screen.getByRole("radio", { name: "Entidade" }));
    await userEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByText("Selecione a entidade de destino")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("Entidade Private escolhida: envia entidade_tipo", async () => {
    montar();
    await preencherTextos();

    await userEvent.click(screen.getByRole("radio", { name: "Entidade" }));
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "Private" }));
    await userEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({ direcionamento_tipo: "entidade", entidade_tipo: "private" })
    );
  });

  it("Usuário sem escolher o usuário: pede o destino", async () => {
    montar();
    await preencherTextos();

    await userEvent.click(screen.getByRole("radio", { name: "Usuário" }));
    await userEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByText("Selecione o usuário de destino")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("trocar o direcionamento limpa o destino escolhido antes", async () => {
    montar();
    await preencherTextos();

    await userEvent.click(screen.getByRole("radio", { name: "Entidade" }));
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "Admin" }));
    await userEvent.click(screen.getByRole("radio", { name: "Geral" }));
    await userEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].entidade_tipo).toBeUndefined();
  });

  it("depois de enviar, o formulário é limpo", async () => {
    montar();
    await preencherTextos();
    await userEvent.click(screen.getByRole("radio", { name: "Geral" }));

    await userEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    await waitFor(() => expect(screen.getByLabelText(/Título/)).toHaveValue(""));
    expect(screen.getByLabelText(/Conteúdo/)).toHaveValue("");
  });

  it("mostra os erros do backend e, enquanto envia, desabilita o botão", () => {
    montar({ backendErrors: ["Falha ao enviar."], isLoading: true });

    expect(screen.getByText("Falha ao enviar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();
  });

  it("a busca de grupos de empresa é paginada e ignora os excluídos", () => {
    montar();

    expect(buscas.grupos).toHaveBeenCalledWith(expect.objectContaining({ page: 1, excluido: false, por_pagina: 10 }));
  });
});
