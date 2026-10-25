/**
 * AcessoSuporteFormConceder (Private): o cliente escolhe um administrador e a duração e confirma.
 * O envio lê os valores completos com `getValues()` e o resumo da confirmação usa `useWatch`
 * (ambos introduzidos na FRONT-003).
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ADMIN_ID = "550e8400-e29b-41d4-a716-446655440000";
const administradores = vi.hoisted(() => ({
  data: [
    { id: "550e8400-e29b-41d4-a716-446655440000", nome: "Ana Suporte", email: "ana@suporte.com" },
    { id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8", nome: "Bruno Suporte", email: "bruno@suporte.com" },
  ],
  isLoading: false,
}));
const buscaAdmins = vi.hoisted(() => vi.fn());
const permissao = vi.hoisted(() => ({ concedida: true }));

vi.mock("@/domains/private/lookup/hooks/useAdministradores", () => ({
  useAdministradores: (...args: unknown[]) => {
    buscaAdmins(...args);
    return administradores;
  },
}));
vi.mock("@/app/(private)/providers/private-permission-provider", () => ({
  usePrivatePermission: () => ({ can: () => permissao.concedida, isLoading: false }),
}));
vi.mock("@/hooks/use-debounce", () => ({ useDebouncedValue: (valor: unknown) => valor }));

import { AcessoSuporteFormConceder } from "@/features/private/acesso-suporte/components/AcessoSuporteFormConceder";

const onSubmit = vi.fn();

function montar(props: Partial<Parameters<typeof AcessoSuporteFormConceder>[0]> = {}) {
  return render(<AcessoSuporteFormConceder onSubmit={onSubmit} {...props} />);
}

async function escolherAdministrador(nome: string) {
  await userEvent.click(screen.getByRole("combobox", { name: /administrador/i }));
  await userEvent.click(await screen.findByRole("option", { name: new RegExp(nome) }));
}

beforeEach(() => {
  onSubmit.mockReset().mockResolvedValue(undefined);
  buscaAdmins.mockClear();
  permissao.concedida = true;
});

describe("AcessoSuporteFormConceder", () => {
  it("começa com 30 minutos e sem administrador escolhido", () => {
    montar();

    expect(screen.getByRole("combobox", { name: /duração/i })).toHaveTextContent("30 minutos");
    expect(screen.getByRole("combobox", { name: /administrador/i })).toHaveTextContent("Selecione um administrador");
  });

  it("sem administrador, mostra o erro de validação e não abre a confirmação nem envia", async () => {
    montar();

    await userEvent.click(screen.getByRole("button", { name: "Conceder acesso" }));

    expect(await screen.findByText("Selecione um administrador.")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("a confirmação resume o administrador e a duração escolhidos (valores observados)", async () => {
    montar();

    await escolherAdministrador("Bruno");
    await userEvent.click(screen.getByRole("combobox", { name: /duração/i }));
    await userEvent.click(await screen.findByRole("option", { name: "2 horas (máximo)" }));
    await userEvent.click(screen.getByRole("button", { name: "Conceder acesso" }));

    const dialogo = await screen.findByRole("alertdialog");
    expect(within(dialogo).getByText("Bruno Suporte")).toBeInTheDocument();
    expect(within(dialogo).getByText("2 horas (máximo)")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled(); // só envia depois de confirmar
  });

  it("cancelar a confirmação não envia nada", async () => {
    montar();

    await escolherAdministrador("Ana");
    await userEvent.click(screen.getByRole("button", { name: "Conceder acesso" }));
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar", hidden: false }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("confirmar envia os valores COMPLETOS (administrador, duração e motivo) e a função setError", async () => {
    montar();

    await escolherAdministrador("Ana");
    await userEvent.type(screen.getByPlaceholderText("Descreva brevemente o motivo do suporte (opcional)"), "Erro ao emitir nota");
    await userEvent.click(screen.getByRole("button", { name: "Conceder acesso" }));
    await userEvent.click(await screen.findByRole("button", { name: "Confirmar e conceder" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      { usuario_admin_id: ADMIN_ID, duracao_minutos: 30, motivo: "Erro ao emitir nota" },
      expect.any(Function)
    );
  });

  it("sem a permissão private.acesso_suporte.conceder o botão de conceder não é exibido", () => {
    permissao.concedida = false;
    montar();

    expect(screen.queryByRole("button", { name: "Conceder acesso" })).not.toBeInTheDocument();
  });

  it("mostra os erros do backend recebidos por props", () => {
    montar({ backendErrors: ["O usuário selecionado não é um administrador ativo."] });

    expect(screen.getByText("O usuário selecionado não é um administrador ativo.")).toBeInTheDocument();
  });
});
