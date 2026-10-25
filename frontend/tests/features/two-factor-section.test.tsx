/**
 * TwoFactorSection (Admin e Private): habilitar e desabilitar o 2FA. Cobre o `useSyncedState`
 * (estado local que acompanha a prop `twoFactorEnabled`) em uso real, refatorado na FRONT-003.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const habilitar = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const confirmar = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const desabilitar = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const toastSucesso = vi.hoisted(() => vi.fn());

const hooks = vi.hoisted(() => ({
  useHabilitar2FA: () => habilitar,
  useConfirmar2FA: () => confirmar,
  useDesabilitar2FA: () => desabilitar,
}));
vi.mock("@/domains/admin/perfil/autenticacao-dois-fatores/hooks/useAutenticacaoDoisFatores", () => hooks);
vi.mock("@/domains/private/perfil/autenticacao-dois-fatores/hooks/useAutenticacaoDoisFatores", () => hooks);
vi.mock("sonner", () => ({ toast: { success: toastSucesso, error: vi.fn() } }));

import { TwoFactorSection as TwoFactorAdmin } from "@/features/admin/perfil/components/seguranca/TwoFactorSection";
import { TwoFactorSection as TwoFactorPrivate } from "@/features/private/perfil/components/seguranca/TwoFactorSection";

type Opcoes = { onSuccess?: (dados: unknown) => void; onError?: (erro: unknown) => void };

const erroDeApi = (mensagem: string) => ({ response: { data: { errors: { business: [mensagem] } } } });

async function digitarCodigo(dialog: HTMLElement, codigo: string) {
  const campo = dialog.querySelector<HTMLInputElement>("input[data-input-otp]");
  expect(campo).not.toBeNull();
  await userEvent.type(campo as HTMLInputElement, codigo);
}

beforeEach(() => {
  for (const m of [habilitar, confirmar, desabilitar]) {
    m.mutate.mockReset();
    m.isPending = false;
  }
  toastSucesso.mockReset();
});

describe.each([
  ["admin", TwoFactorAdmin],
  ["private", TwoFactorPrivate],
])("TwoFactorSection (%s)", (_nome, TwoFactorSection) => {
  it("oferece Habilitar quando o 2FA está desligado e Desabilitar quando está ligado", () => {
    const { rerender } = render(<TwoFactorSection twoFactorEnabled={false} />);
    expect(screen.getByRole("button", { name: "Habilitar 2FA" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desabilitar 2FA" })).not.toBeInTheDocument();

    rerender(<TwoFactorSection twoFactorEnabled />);
    expect(screen.getByRole("button", { name: "Desabilitar 2FA" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Habilitar 2FA" })).not.toBeInTheDocument();
  });

  it("habilitar: pede a senha, mostra o QR Code, confirma o código e passa para o estado ligado", async () => {
    habilitar.mutate.mockImplementation((_vars: unknown, opcoes: Opcoes) =>
      opcoes.onSuccess?.({ data: { otpauth_url: "otpauth://totp/App:maria?secret=ABC" } })
    );
    confirmar.mutate.mockImplementation((_vars: unknown, opcoes: Opcoes) => opcoes.onSuccess?.({}));
    render(<TwoFactorSection twoFactorEnabled={false} />);

    await userEvent.click(screen.getByRole("button", { name: "Habilitar 2FA" }));
    const dialog = await screen.findByRole("dialog");

    // sem senha o botão fica desabilitado
    expect(within(dialog).getByRole("button", { name: "Gerar QR Code" })).toBeDisabled();
    await userEvent.type(within(dialog).getByPlaceholderText("Digite sua senha"), "Senha123@");
    await userEvent.click(within(dialog).getByRole("button", { name: "Gerar QR Code" }));

    expect(habilitar.mutate).toHaveBeenCalledWith({ senha: "Senha123@" }, expect.any(Object));
    expect(dialog.querySelector("svg")).not.toBeNull(); // QR Code renderizado
    expect(within(dialog).queryByPlaceholderText("Digite sua senha")).not.toBeInTheDocument();

    // Confirmar só habilita com os 6 dígitos
    expect(within(dialog).getByRole("button", { name: "Confirmar" })).toBeDisabled();
    await digitarCodigo(dialog, "123456");
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirmar" }));

    expect(confirmar.mutate).toHaveBeenCalledWith({ codigo: "123456" }, expect.any(Object));
    expect(toastSucesso).toHaveBeenCalledWith("2FA ativado com sucesso!");
    expect(await screen.findByRole("button", { name: "Desabilitar 2FA" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("habilitar: mostra o erro do backend quando a senha está errada", async () => {
    habilitar.mutate.mockImplementation((_vars: unknown, opcoes: Opcoes) => opcoes.onError?.(erroDeApi("Senha incorreta.")));
    render(<TwoFactorSection twoFactorEnabled={false} />);

    await userEvent.click(screen.getByRole("button", { name: "Habilitar 2FA" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByPlaceholderText("Digite sua senha"), "errada");
    await userEvent.click(within(dialog).getByRole("button", { name: "Gerar QR Code" }));

    expect(await within(dialog).findByText("Senha incorreta.")).toBeInTheDocument();
    expect(dialog.querySelector("svg.lucide-loader-circle, svg.animate-spin")).toBeNull();
  });

  it("desabilitar: exige senha e código de 6 dígitos e volta para o estado desligado", async () => {
    desabilitar.mutate.mockImplementation((_vars: unknown, opcoes: Opcoes) => opcoes.onSuccess?.({}));
    render(<TwoFactorSection twoFactorEnabled />);

    await userEvent.click(screen.getByRole("button", { name: "Desabilitar 2FA" }));
    const dialog = await screen.findByRole("dialog");
    const confirmarDesativacao = within(dialog).getByRole("button", { name: "Confirmar Desativação" });
    expect(confirmarDesativacao).toBeDisabled();

    await userEvent.type(within(dialog).getByPlaceholderText("Digite sua senha"), "Senha123@");
    expect(confirmarDesativacao).toBeDisabled(); // ainda falta o código
    await digitarCodigo(dialog, "654321");
    expect(confirmarDesativacao).toBeEnabled();
    await userEvent.click(confirmarDesativacao);

    expect(desabilitar.mutate).toHaveBeenCalledWith({ senha: "Senha123@", codigo: "654321" }, expect.any(Object));
    expect(toastSucesso).toHaveBeenCalledWith("2FA desabilitado com sucesso!");
    expect(await screen.findByRole("button", { name: "Habilitar 2FA" })).toBeInTheDocument();
  });

  it("useSyncedState: o resultado local é mantido enquanto a prop não muda e cede quando ela muda", async () => {
    desabilitar.mutate.mockImplementation((_vars: unknown, opcoes: Opcoes) => opcoes.onSuccess?.({}));
    const { rerender } = render(<TwoFactorSection twoFactorEnabled />);

    await userEvent.click(screen.getByRole("button", { name: "Desabilitar 2FA" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByPlaceholderText("Digite sua senha"), "Senha123@");
    await digitarCodigo(dialog, "654321");
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirmar Desativação" }));
    expect(await screen.findByRole("button", { name: "Habilitar 2FA" })).toBeInTheDocument();

    // a prop continua `true` (o servidor ainda não atualizou): o estado local (desligado) é mantido
    rerender(<TwoFactorSection twoFactorEnabled />);
    expect(screen.getByRole("button", { name: "Habilitar 2FA" })).toBeInTheDocument();

    // quando o dado do servidor muda, o componente passa a segui-lo
    rerender(<TwoFactorSection twoFactorEnabled={false} />);
    rerender(<TwoFactorSection twoFactorEnabled />);
    expect(screen.getByRole("button", { name: "Desabilitar 2FA" })).toBeInTheDocument();
  });
});
