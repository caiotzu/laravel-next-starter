/**
 * Aba "Login social" do perfil (Admin e Private): listar, vincular (com confirmação de senha),
 * desvincular (com confirmação) e abertura da aba/aviso a partir do retorno do BFF.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const lista = vi.hoisted(() => ({ data: undefined as unknown, isLoading: false, isError: false }));
const iniciar = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const desvincular = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

const nav = vi.hoisted(() => ({ replace: vi.fn(), pathname: "/perfil", params: new URLSearchParams() }));

const hooks = vi.hoisted(() => () => ({
  useLoginSocial: () => lista,
  useIniciarVinculoLoginSocial: () => iniciar,
  useDesvincularLoginSocial: () => desvincular,
}));

vi.mock("@/domains/admin/perfil/login-social/hooks/useLoginSocial", hooks);
vi.mock("@/domains/private/perfil/login-social/hooks/useLoginSocial", hooks);
vi.mock("sonner", () => ({ toast }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.params,
}));

// Conteúdos das outras abas não interessam aqui.
vi.mock("@/features/admin/perfil/components/PerfilTabContent", () => ({ PerfilTabContent: () => <div>conteudo-perfil</div> }));
vi.mock("@/features/admin/perfil/components/SegurancaTabContent", () => ({ SegurancaTabContent: () => <div>conteudo-seguranca</div> }));
vi.mock("@/features/private/perfil/components/PerfilTabContent", () => ({ PerfilTabContent: () => <div>conteudo-perfil</div> }));
vi.mock("@/features/private/perfil/components/SegurancaTabContent", () => ({ SegurancaTabContent: () => <div>conteudo-seguranca</div> }));

import { LoginSocialSection as SecaoAdmin } from "@/features/admin/perfil/components/login-social/LoginSocialSection";
import { PerfilTabs as TabsAdmin } from "@/features/admin/perfil/components/PerfilTabs";
import { LoginSocialSection as SecaoPrivate } from "@/features/private/perfil/components/login-social/LoginSocialSection";
import { PerfilTabs as TabsPrivate } from "@/features/private/perfil/components/PerfilTabs";

type Opcoes = { onSuccess?: (dados: unknown) => void; onError?: (erro: unknown) => void; onSettled?: () => void };

const google = (extra = {}) => ({
  chave: "google", nome: "Google", disponivel: true, vinculado: false,
  email: null, vinculadoEm: null, ultimoLoginEm: null, ...extra,
});

const usuario = { id: "u1", google2fa_enable: false } as never;

beforeEach(() => {
  iniciar.mutate.mockReset();
  desvincular.mutate.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
  nav.replace.mockReset();
  nav.params = new URLSearchParams();
  lista.isLoading = false;
  lista.isError = false;
  lista.data = { data: [google()] };
});

describe.each([
  ["admin", SecaoAdmin],
  ["private", SecaoPrivate],
])("LoginSocialSection (%s)", (_nome, Secao) => {
  it("lista o provedor não vinculado com o botão Vincular", () => {
    render(<Secao />);

    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("Não vinculado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vincular/ })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Desvincular/ })).not.toBeInTheDocument();
  });

  it("mostra a mensagem quando não há provedores disponíveis", () => {
    lista.data = { data: [] };

    render(<Secao />);

    expect(screen.getByText("Nenhum provedor de login social disponível.")).toBeInTheDocument();
  });

  it("vincular pede a senha e só então inicia o fluxo, navegando para o provedor", async () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, assign } });

    render(<Secao />);

    await userEvent.click(screen.getByRole("button", { name: /Vincular/ }));

    const continuar = screen.getByRole("button", { name: /Continuar com Google/ });
    expect(continuar).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText("Digite sua senha"), "Senha123@");
    await userEvent.click(continuar);

    expect(iniciar.mutate).toHaveBeenCalledWith({ provedor: "google", senha: "Senha123@" }, expect.any(Object));

    (iniciar.mutate.mock.calls[0][1] as Opcoes).onSuccess?.({ data: { url: "https://accounts.google.com/auth" } });

    expect(assign).toHaveBeenCalledWith("https://accounts.google.com/auth");
  });

  it("senha incorreta mostra o erro do backend dentro do diálogo", async () => {
    render(<Secao />);

    await userEvent.click(screen.getByRole("button", { name: /Vincular/ }));
    await userEvent.type(screen.getByPlaceholderText("Digite sua senha"), "errada");
    await userEvent.click(screen.getByRole("button", { name: /Continuar com Google/ }));

    (iniciar.mutate.mock.calls[0][1] as Opcoes).onError?.({
      response: { data: { errors: { business: ["A senha está incorreta."] } } },
    });

    expect(await screen.findByText("A senha está incorreta.")).toBeInTheDocument();
  });

  it("vinculado mostra o e-mail da conta e permite desvincular, com confirmação", async () => {
    lista.data = { data: [google({
      vinculado: true, email: "pessoa@gmail.com",
      vinculadoEm: "2026-11-19T10:00:00Z", ultimoLoginEm: null,
    })] };

    render(<Secao />);

    expect(screen.getByText("Vinculado")).toBeInTheDocument();
    expect(screen.getByText(/pessoa@gmail\.com/)).toBeInTheDocument();
    expect(screen.getByText(/Último acesso: Nunca/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Vincular/ })).not.toBeInTheDocument();

    // sem confirmar, nada acontece
    await userEvent.click(screen.getByRole("button", { name: /Desvincular/ }));
    expect(desvincular.mutate).not.toHaveBeenCalled();

    const confirmar = await screen.findByRole("button", { name: "Desvincular" });
    await userEvent.click(confirmar);

    expect(desvincular.mutate).toHaveBeenCalledWith("google", expect.any(Object));

    (desvincular.mutate.mock.calls[0][1] as Opcoes).onSuccess?.(undefined);
    expect(toast.success).toHaveBeenCalledWith("Conta Google desvinculada com sucesso!");
  });

  it("provedor desativado depois do vínculo: aparece como indisponível, mas ainda dá para desvincular", () => {
    lista.data = { data: [google({ vinculado: true, disponivel: false, email: "a@gmail.com" })] };

    render(<Secao />);

    expect(screen.getByText("Indisponível no momento")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Desvincular/ })).toBeEnabled();
  });

  it("não deixa vincular um provedor indisponível", () => {
    lista.data = { data: [google({ disponivel: false })] };

    render(<Secao />);

    expect(screen.getByRole("button", { name: /Vincular/ })).toBeDisabled();
  });

  it("falha ao desvincular mostra o erro", async () => {
    lista.data = { data: [google({ vinculado: true, email: "a@gmail.com" })] };

    render(<Secao />);

    await userEvent.click(screen.getByRole("button", { name: /Desvincular/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Desvincular" }));

    (desvincular.mutate.mock.calls[0][1] as Opcoes).onError?.({
      response: { data: { errors: { business: ["Defina uma senha de acesso antes de desvincular a conta."] } } },
    });

    expect(toast.error).toHaveBeenCalledWith("Defina uma senha de acesso antes de desvincular a conta.");
  });
});

describe.each([
  ["admin", TabsAdmin],
  ["private", TabsPrivate],
])("PerfilTabs (%s) — aba Login social", (_nome, Tabs) => {
  it("tem a aba Login social e abre em Perfil por padrão", () => {
    render(<Tabs user={usuario} />);

    expect(screen.getByRole("tab", { name: /Login social/ })).toBeInTheDocument();
    expect(screen.getByText("conteudo-perfil")).toBeInTheDocument();
  });

  it("abre direto em Login social quando o BFF devolve ?aba=login-social", () => {
    nav.params = new URLSearchParams("aba=login-social");

    render(<Tabs user={usuario} />);

    expect(screen.getByRole("tab", { name: /Login social/ })).toHaveAttribute("data-state", "active");
    expect(screen.getByText("Contas conectadas")).toBeInTheDocument();
  });

  it("?vinculo=ok mostra o sucesso uma vez e limpa a URL", async () => {
    nav.params = new URLSearchParams("aba=login-social&vinculo=ok");

    render(<Tabs user={usuario} />);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Conta vinculada com sucesso!"));
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith(nav.pathname);
  });

  it("?vinculo=invalido mostra erro", async () => {
    nav.params = new URLSearchParams("aba=login-social&vinculo=invalido");

    render(<Tabs user={usuario} />);

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("valor desconhecido em ?vinculo= é ignorado (sem aviso e sem texto da URL)", () => {
    nav.params = new URLSearchParams("vinculo=<script>alert(1)</script>");

    render(<Tabs user={usuario} />);

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
