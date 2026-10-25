/**
 * PerfilTabContent e SenhaSection (Admin e Private). Cobrem o `useWatch` introduzido na FRONT-003:
 * o campo "senha atual" aparece só quando o e-mail é alterado, e os requisitos da nova senha
 * reagem ao que é digitado.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const atualizarPerfil = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const atualizarSenha = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("@/domains/admin/perfil/usuario/hooks/useAtualizarPerfil", () => ({ useAtualizarPerfil: () => atualizarPerfil }));
vi.mock("@/domains/private/perfil/usuario/hooks/useAtualizarPerfil", () => ({ useAtualizarPerfil: () => atualizarPerfil }));
vi.mock("@/domains/admin/perfil/usuario/hooks/useAtualizarSenha", () => ({ useAtualizarSenhaPerfil: () => atualizarSenha }));
vi.mock("@/domains/private/perfil/usuario/hooks/useAtualizarSenha", () => ({ useAtualizarSenhaPerfil: () => atualizarSenha }));
vi.mock("sonner", () => ({ toast }));

import { PerfilTabContent as PerfilAdmin } from "@/features/admin/perfil/components/PerfilTabContent";
import { SenhaSection as SenhaAdmin } from "@/features/admin/perfil/components/seguranca/SenhaSection";
import { PerfilTabContent as PerfilPrivate } from "@/features/private/perfil/components/PerfilTabContent";
import { SenhaSection as SenhaPrivate } from "@/features/private/perfil/components/seguranca/SenhaSection";

type Opcoes = { onSuccess?: (dados: unknown) => void; onError?: (erro: unknown) => void };

const usuario = {
  id: "u1", nome: "Maria Silva", email: "maria@exemplo.com", avatar: null, grupo: "Financeiro",
  status: "ativo", google2fa_enable: false, google2fa_confirmado_em: null,
} as never;

beforeEach(() => {
  atualizarPerfil.mutate.mockReset();
  atualizarSenha.mutate.mockReset();
  toast.success.mockReset();
});

describe.each([
  ["admin", PerfilAdmin],
  ["private", PerfilPrivate],
])("PerfilTabContent (%s)", (_nome, Perfil) => {
  const campoEmail = () => screen.getByPlaceholderText("Digite seu e-mail");
  const botaoSalvar = () => screen.getByRole("button", { name: "Salvar" });

  it("começa com os dados do usuário, sem pedir senha e com Salvar desabilitado", () => {
    render(<Perfil user={usuario} />);

    expect(screen.getByPlaceholderText("Digite seu nome")).toHaveValue("Maria Silva");
    expect(campoEmail()).toHaveValue("maria@exemplo.com");
    expect(screen.queryByPlaceholderText("Confirme com sua senha atual")).not.toBeInTheDocument();
    expect(botaoSalvar()).toBeDisabled();
  });

  it("pede a senha atual SÓ enquanto o e-mail está diferente do cadastrado", async () => {
    render(<Perfil user={usuario} />);

    await userEvent.type(campoEmail(), "x");
    expect(screen.getByPlaceholderText("Confirme com sua senha atual")).toBeInTheDocument();

    await userEvent.type(campoEmail(), "{Backspace}");
    expect(screen.queryByPlaceholderText("Confirme com sua senha atual")).not.toBeInTheDocument();
  });

  it("alterar só o nome envia sem senha atual", async () => {
    render(<Perfil user={usuario} />);

    await userEvent.type(screen.getByPlaceholderText("Digite seu nome"), " Souza");
    await userEvent.click(botaoSalvar());

    await waitFor(() =>
      expect(atualizarPerfil.mutate).toHaveBeenCalledWith({ nome: "Maria Silva Souza", email: "maria@exemplo.com" }, expect.any(Object))
    );
  });

  it("alterar o e-mail sem informar a senha atual bloqueia o envio e mostra o aviso", async () => {
    render(<Perfil user={usuario} />);

    await userEvent.clear(campoEmail());
    await userEvent.type(campoEmail(), "novo@exemplo.com");
    await userEvent.click(botaoSalvar());

    expect(await screen.findByText("Informe sua senha atual para alterar o e-mail.")).toBeInTheDocument();
    expect(atualizarPerfil.mutate).not.toHaveBeenCalled();
  });

  it("alterar o e-mail com a senha atual envia os três campos e, no sucesso, atualiza o formulário", async () => {
    atualizarPerfil.mutate.mockImplementation((_vars: unknown, opcoes: Opcoes) =>
      opcoes.onSuccess?.({ nome: "Maria Silva", email: "novo@exemplo.com" })
    );
    const { rerender } = render(<Perfil user={usuario} />);

    await userEvent.clear(campoEmail());
    await userEvent.type(campoEmail(), "novo@exemplo.com");
    await userEvent.type(screen.getByPlaceholderText("Confirme com sua senha atual"), "Senha123@");
    await userEvent.click(botaoSalvar());

    await waitFor(() =>
      expect(atualizarPerfil.mutate).toHaveBeenCalledWith(
        { nome: "Maria Silva", email: "novo@exemplo.com", senha_atual: "Senha123@" },
        expect.any(Object)
      )
    );
    expect(toast.success).toHaveBeenCalledWith("Perfil atualizado com sucesso!");

    // na aplicação o cache do usuário é atualizado e a tela recebe o `user` novo
    rerender(<Perfil user={{ ...(usuario as object), email: "novo@exemplo.com" } as never} />);
    await waitFor(() => expect(screen.queryByPlaceholderText("Confirme com sua senha atual")).not.toBeInTheDocument());
    expect(campoEmail()).toHaveValue("novo@exemplo.com");
    expect(botaoSalvar()).toBeDisabled();
  });
});

describe.each([
  ["admin", SenhaAdmin],
  ["private", SenhaPrivate],
])("SenhaSection (%s)", (_nome, Senha) => {
  const cor = (texto: string) => screen.getByText(texto).className;
  const botao = () => screen.getByRole("button", { name: "Atualizar Senha" });

  it("os requisitos da nova senha reagem ao que é digitado", async () => {
    render(<Senha />);
    expect(cor("Letra minúscula")).not.toContain("text-green-600");

    await userEvent.type(screen.getByPlaceholderText("Nova senha"), "abc");
    expect(cor("Letra minúscula")).toContain("text-green-600");
    expect(cor("Letra maiúscula")).not.toContain("text-green-600");

    await userEvent.type(screen.getByPlaceholderText("Nova senha"), "DEF123!x");
    for (const requisito of ["Mínimo 8 caracteres", "Letra maiúscula", "Letra minúscula", "Número", "Caractere especial"]) {
      expect(cor(requisito)).toContain("text-green-600");
    }
  });

  it("o botão só habilita quando a nova senha atende a todos os requisitos (a senha atual é validada no envio)", async () => {
    render(<Senha />);
    expect(botao()).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText("Nova senha"), "Abc123!x");
    expect(botao()).toBeEnabled();

    await userEvent.clear(screen.getByPlaceholderText("Nova senha"));
    await userEvent.type(screen.getByPlaceholderText("Nova senha"), "fraca");
    expect(botao()).toBeDisabled();
  });

  it("enviar sem a senha atual mostra o erro de validação e não chama a API", async () => {
    render(<Senha />);

    await userEvent.type(screen.getByPlaceholderText("Nova senha"), "Abc123!x");
    await userEvent.type(screen.getByPlaceholderText("Confirmar nova senha"), "Abc123!x");
    await userEvent.click(botao());

    expect(await screen.findByText("Informe sua senha atual.")).toBeInTheDocument();
    expect(atualizarSenha.mutate).not.toHaveBeenCalled();
  });

  it("confirmação diferente da nova senha mostra o erro e não chama a API", async () => {
    render(<Senha />);

    await userEvent.type(screen.getByPlaceholderText("Senha atual"), "SenhaAntiga1!");
    await userEvent.type(screen.getByPlaceholderText("Nova senha"), "Abc123!x");
    await userEvent.type(screen.getByPlaceholderText("Confirmar nova senha"), "Outra123!x");
    await userEvent.click(botao());

    expect(await screen.findByText("As senhas não conferem.")).toBeInTheDocument();
    expect(atualizarSenha.mutate).not.toHaveBeenCalled();
  });

  it("no envio chama a API com os três campos, avisa o sucesso e limpa o formulário", async () => {
    atualizarSenha.mutate.mockImplementation((_vars: unknown, opcoes: Opcoes) => opcoes.onSuccess?.({}));
    render(<Senha />);

    await userEvent.type(screen.getByPlaceholderText("Senha atual"), "SenhaAntiga1!");
    await userEvent.type(screen.getByPlaceholderText("Nova senha"), "Abc123!x");
    await userEvent.type(screen.getByPlaceholderText("Confirmar nova senha"), "Abc123!x");
    await userEvent.click(botao());

    await waitFor(() =>
      expect(atualizarSenha.mutate).toHaveBeenCalledWith(
        { senha_atual: "SenhaAntiga1!", senha_nova: "Abc123!x", senha_nova_confirma: "Abc123!x" },
        expect.any(Object)
      )
    );
    expect(toast.success).toHaveBeenCalledWith("Senha atualizada com sucesso!");
    await waitFor(() => expect(screen.getByPlaceholderText("Nova senha")).toHaveValue(""));
    expect(cor("Letra minúscula")).not.toContain("text-green-600"); // requisitos voltam ao estado inicial
  });

  it("mostra o erro de negócio devolvido pelo backend", async () => {
    atualizarSenha.mutate.mockImplementation((_vars: unknown, opcoes: Opcoes) =>
      opcoes.onError?.({ response: { data: { errors: { business: ["Senha atual incorreta."] } } } })
    );
    render(<Senha />);

    await userEvent.type(screen.getByPlaceholderText("Senha atual"), "errada");
    await userEvent.type(screen.getByPlaceholderText("Nova senha"), "Abc123!x");
    await userEvent.type(screen.getByPlaceholderText("Confirmar nova senha"), "Abc123!x");
    await userEvent.click(botao());

    expect(await screen.findByText("Senha atual incorreta.")).toBeInTheDocument();
  });
});
