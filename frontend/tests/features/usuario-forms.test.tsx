/**
 * TEST-005: UsuarioFormCreate e UsuarioFormEdit (Admin e Private). Formulários dirigidos por
 * props: o teste confere o que o usuário vê, a validação do Zod e o payload entregue a `onSubmit`.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UsuarioFormCreate as CreateAdmin } from "@/features/admin/usuario/components/UsuarioFormCreate";
import { UsuarioFormEdit as EditAdmin } from "@/features/admin/usuario/components/UsuarioFormEdit";
import { UsuarioFormCreate as CreatePrivate } from "@/features/private/usuario/components/UsuarioFormCreate";
import { UsuarioFormEdit as EditPrivate } from "@/features/private/usuario/components/UsuarioFormEdit";

const GRUPO_A = "550e8400-e29b-41d4-a716-446655440000";
const GRUPO_B = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";

const grupos = [
  { id: GRUPO_A, descricao: "Financeiro", createdAt: "2026-01-01", updatedAt: null, deletedAt: null },
  { id: GRUPO_B, descricao: "Suporte", createdAt: "2026-01-01", updatedAt: null, deletedAt: null },
];

const usuarioBase = {
  id: "u1",
  grupoId: GRUPO_A,
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  status: "ativo" as const,
  avatar: null,
  google2faEnable: false,
  google2faConfirmadoEm: null,
  ultimoLoginEm: null,
  ultimoIp: null,
  createdAt: "2026-01-01",
  updatedAt: null,
  deletedAt: null,
};

const onSubmit = vi.fn();

beforeEach(() => onSubmit.mockReset().mockResolvedValue(undefined));

const areas = [
  { nome: "Admin", Create: CreateAdmin, Edit: EditAdmin, voltar: "/admin/usuarios" },
  { nome: "Private", Create: CreatePrivate, Edit: EditPrivate, voltar: "/usuarios" },
] as const;

describe.each(areas)("UsuarioFormCreate ($nome)", ({ Create, voltar }) => {
  const montar = (props: Partial<Parameters<typeof Create>[0]> = {}) =>
    render(<Create onSubmit={onSubmit} grupos={grupos as never} isLoadingGrupos={false} {...props} />);

  it("renderiza os campos, o título e os botões", () => {
    montar();

    expect(screen.getByText("Cadastrar Usuário")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome/)).toHaveValue("");
    expect(screen.getByLabelText(/E-mail/)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", voltar);
  });

  it("enviar vazio mostra os erros de validação e NÃO chama onSubmit", async () => {
    montar();

    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("O nome do usuário é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("E-mail inválido")).toBeInTheDocument();
    expect(screen.getByText("Grupo inválido ou não selecionado")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("e-mail sem domínio completo é recusado pelo Zod (o HTML aceitaria `a@b`)", async () => {
    montar();

    await userEvent.type(screen.getByLabelText(/Nome/), "Maria");
    await userEvent.type(screen.getByLabelText(/E-mail/), "a@b");
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("E-mail inválido")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("preenchido e com grupo escolhido, envia o payload completo", async () => {
    montar();

    await userEvent.type(screen.getByLabelText(/Nome/), "João Lima");
    await userEvent.type(screen.getByLabelText(/E-mail/), "joao@exemplo.com");

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "Suporte" }));

    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ nome: "João Lima", email: "joao@exemplo.com", grupo_id: GRUPO_B });
    expect(typeof onSubmit.mock.calls[0][1]).toBe("function"); // setError, para erros do backend por campo
  });

  it("com `usuario` vem preenchido e o botão vira Salvar", () => {
    montar({ usuario: usuarioBase as never });

    expect(screen.getByText("Editar Usuário")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome/)).toHaveValue("Maria Souza");
    expect(screen.getByLabelText(/E-mail/)).toHaveValue("maria@exemplo.com");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("enquanto salva, desabilita os campos e o botão", () => {
    montar({ isLoading: true });

    expect(screen.getByLabelText(/Nome/)).toBeDisabled();
    expect(screen.getByLabelText(/E-mail/)).toBeDisabled();
    expect(screen.getByRole("button", { name: /Cadastrar/ })).toBeDisabled();
  });

  it("mostra os erros do backend", () => {
    montar({ backendErrors: ["E-mail já cadastrado."] });

    expect(screen.getByText("E-mail já cadastrado.")).toBeInTheDocument();
    expect(screen.getByText("Ocorreu um erro durante a operação")).toBeInTheDocument();
  });

  it("sem erros do backend não mostra o alerta", () => {
    montar({ backendErrors: [] });

    expect(screen.queryByText("Ocorreu um erro durante a operação")).not.toBeInTheDocument();
  });
});

describe.each(areas)("UsuarioFormEdit ($nome)", ({ Edit, voltar }) => {
  const montar = (usuario = usuarioBase, props: Partial<Parameters<typeof Edit>[0]> = {}) =>
    render(<Edit onSubmit={onSubmit} usuario={usuario as never} grupos={grupos as never} isLoadingGrupos={false} {...props} />);

  it("vem preenchido com os dados do usuário", () => {
    montar();

    expect(screen.getByText("Editar Usuário")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome/)).toHaveValue("Maria Souza");
    expect(screen.getByLabelText(/E-mail/)).toHaveValue("maria@exemplo.com");
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", voltar);
  });

  it("apagar o nome e salvar mostra o erro e não envia", async () => {
    montar();

    await userEvent.clear(screen.getByLabelText(/Nome/));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("O nome do usuário é obrigatório")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("alterar o nome e salvar envia os dados (com status, pois ele é editável)", async () => {
    montar();

    await userEvent.clear(screen.getByLabelText(/Nome/));
    await userEvent.type(screen.getByLabelText(/Nome/), "Maria Souza Lima");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({
      nome: "Maria Souza Lima",
      email: "maria@exemplo.com",
      grupo_id: GRUPO_A,
      status: "ativo",
    });
  });

  it.each(["convidado", "expirado"] as const)("usuário %s: o status NÃO é enviado (não pode ser editado)", async (status) => {
    montar({ ...usuarioBase, status });

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("status");
    expect(onSubmit.mock.calls[0][0]).toEqual({ nome: "Maria Souza", email: "maria@exemplo.com", grupo_id: GRUPO_A });
  });

  it("mostra erros do backend e desabilita o botão ao salvar", () => {
    montar(usuarioBase, { backendErrors: ["Falha ao atualizar."], isLoading: true });

    expect(screen.getByText("Falha ao atualizar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Salvar/ })).toBeDisabled();
  });
});
