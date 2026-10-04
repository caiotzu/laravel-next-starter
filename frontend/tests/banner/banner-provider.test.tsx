import { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BannerProvider as PrivateProvider } from "@/app/(private)/providers/banner-provider";
import { BannerProvider as AdminProvider } from "@/app/admin/providers/banner-provider";

import { marcarNovoLogin, existeBannerPendente } from "@/lib/banner/banner-sessao-storage";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: ({ fill: _f, unoptimized: _u, priority: _p, ...props }: Record<string, unknown>) => <img {...props} />,
}));

const listarPrivate = vi.fn();
const listarAdmin = vi.fn();
vi.mock("@/domains/private/banner/services/bannerService", () => ({
  listarBannersDisponiveis: () => listarPrivate(),
}));
vi.mock("@/domains/admin/banner/services/bannerService", () => ({
  listarBannersDisponiveis: () => listarAdmin(),
}));


const bannerPrivate = {
  id: "b1",
  titulo: "Campanha de Natal",
  conteudo: "Ofertas",
  imagens: [{ id: "i1", url: "/storage/banners/1.png", ordem: 1 }],
  links: [],
};

function wrapper(client: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const titulos = () => screen.queryAllByRole("heading", { name: "Campanha de Natal" });
const aparece = () => waitFor(() => expect(titulos().length).toBeGreaterThan(0));

function novoClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function montar(Provider: typeof PrivateProvider, client = novoClient()) {
  const W = wrapper(client);
  const ui = (
    <W>
      <Provider>
        <div>conteudo</div>
      </Provider>
    </W>
  );
  const result = render(ui);
  return { ...result, rerenderAt: () => result.rerender(ui) };
}

beforeEach(() => {
  pathname = "/";
  listarPrivate.mockReset().mockResolvedValue([bannerPrivate]);
  listarAdmin.mockReset().mockResolvedValue([bannerPrivate]);
});

describe("BannerProvider (private)", () => {
  it("não busca nem exibe banner sem login recém-concluído", async () => {
    pathname = "/home";
    montar(PrivateProvider);

    await act(async () => {});
    expect(listarPrivate).not.toHaveBeenCalled();
    expect(titulos()).toHaveLength(0);
  });

  it("não busca na tela de login mesmo com sinal armado", async () => {
    marcarNovoLogin("private");
    pathname = "/";
    montar(PrivateProvider);

    await act(async () => {});
    expect(listarPrivate).not.toHaveBeenCalled();
    expect(existeBannerPendente("private")).toBe(true);
  });

  it("exibe o banner após o login e consome o sinal", async () => {
    marcarNovoLogin("private");
    pathname = "/home";
    montar(PrivateProvider);

    await aparece();
    expect(listarPrivate).toHaveBeenCalledTimes(1);
    expect(existeBannerPendente("private")).toBe(false);
  });

  it("depois de fechado, trocar de menu NÃO exibe o banner de novo", async () => {
    marcarNovoLogin("private");
    pathname = "/home";
    const { rerenderAt } = montar(PrivateProvider);

    await aparece();
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    await waitFor(() => expect(titulos()).toHaveLength(0));

    for (const destino of ["/perfil", "/chamados", "/usuarios", "/home", "/empresas", "/home"]) {
      pathname = destino;
      rerenderAt();
      await act(async () => {});
    }

    expect(titulos()).toHaveLength(0);
    expect(listarPrivate).toHaveBeenCalledTimes(1);
  });

  it("um novo login volta a exibir o banner", async () => {
    marcarNovoLogin("private");
    pathname = "/home";
    const client = novoClient();
    const primeira = montar(PrivateProvider, client);
    await aparece();
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    primeira.unmount();

    marcarNovoLogin("private");
    montar(PrivateProvider, client);

    await aparece();
    expect(listarPrivate).toHaveBeenCalledTimes(2);
  });

  it("não exibe nada quando não há banners disponíveis e ainda consome o sinal", async () => {
    listarPrivate.mockResolvedValue([]);
    marcarNovoLogin("private");
    pathname = "/home";
    montar(PrivateProvider);

    await waitFor(() => expect(existeBannerPendente("private")).toBe(false));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("consome o sinal mesmo se a consulta falhar", async () => {
    listarPrivate.mockRejectedValue(new Error("falha"));
    marcarNovoLogin("private");
    pathname = "/home";
    montar(PrivateProvider);

    await waitFor(() => expect(existeBannerPendente("private")).toBe(false));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("BannerProvider (admin)", () => {
  it("exibe após o login admin, uma única vez", async () => {
    marcarNovoLogin("admin");
    pathname = "/admin/home";
    const { rerenderAt } = montar(AdminProvider);

    await aparece();
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));

    pathname = "/admin/usuarios";
    rerenderAt();
    await act(async () => {});

    expect(titulos()).toHaveLength(0);
    expect(listarAdmin).toHaveBeenCalledTimes(1);
  });

  it("o sinal do private não dispara o provider admin", async () => {
    marcarNovoLogin("private");
    pathname = "/admin/home";
    montar(AdminProvider);

    await act(async () => {});
    expect(listarAdmin).not.toHaveBeenCalled();
  });
});
