import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosGet = vi.hoisted(() => vi.fn());
const axiosPost = vi.hoisted(() => vi.fn());

vi.mock("axios", () => ({
  default: { get: axiosGet, post: axiosPost, isAxiosError: (e: unknown) => Boolean((e as { isAxiosError?: boolean })?.isAxiosError) },
}));

import { SocialLoginButtons } from "@/components/forms/social-login-buttons";

function renderizar(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("SocialLoginButtons", () => {
  const assign = vi.fn();

  beforeEach(() => {
    axiosGet.mockReset();
    axiosPost.mockReset();
    assign.mockReset();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, assign } });
  });

  it("não renderiza nada quando não há provedores ativos", async () => {
    axiosGet.mockResolvedValue({ data: { data: { provedores: [] } } });

    const { container } = renderizar(<SocialLoginButtons contexto="admin" />);

    await waitFor(() => expect(axiosGet).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("monta um botão por provedor, inclusive um sem ícone cadastrado", async () => {
    axiosGet.mockResolvedValue({
      data: { data: { provedores: [{ chave: "google", nome: "Google" }, { chave: "github", nome: "GitHub" }] } },
    });

    renderizar(<SocialLoginButtons contexto="private" />);

    expect(await screen.findByRole("button", { name: /Entrar com Google/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar com GitHub/ })).toBeInTheDocument();
    expect(axiosGet).toHaveBeenCalledWith("/api/auth/private/social/provedores");
  });

  it("inicia o fluxo e navega para a URL devolvida", async () => {
    axiosGet.mockResolvedValue({ data: { data: { provedores: [{ chave: "google", nome: "Google" }] } } });
    axiosPost.mockResolvedValue({ data: { data: { url: "https://accounts.google.com/auth" } } });

    renderizar(<SocialLoginButtons contexto="admin" />);

    fireEvent.click(await screen.findByRole("button", { name: /Entrar com Google/ }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://accounts.google.com/auth"));
    expect(axiosPost).toHaveBeenCalledWith("/api/auth/admin/social/google/iniciar");
  });

  it("mostra a mensagem do backend quando não consegue iniciar", async () => {
    axiosGet.mockResolvedValue({ data: { data: { provedores: [{ chave: "google", nome: "Google" }] } } });
    axiosPost.mockRejectedValue({ isAxiosError: true, response: { data: { errors: { business: ["Provedor de login não disponível."] } } } });
    const onError = vi.fn();

    renderizar(<SocialLoginButtons contexto="admin" onError={onError} />);

    fireEvent.click(await screen.findByRole("button", { name: /Entrar com Google/ }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith("Provedor de login não disponível."));
    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Entrar com Google/ })).toBeEnabled();
  });
});
