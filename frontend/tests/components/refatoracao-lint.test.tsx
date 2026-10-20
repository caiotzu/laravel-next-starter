/**
 * Trava o comportamento de trechos refatorados na FRONT-003 (useWatch, useSyncExternalStore,
 * ajuste de estado durante a renderização), para provar que nada mudou para o usuário.
 */
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: ({ fill: _f, unoptimized: _u, priority: _p, ...props }: Record<string, unknown>) => <img {...props} />,
}));

import { PrimeiroAcessoForm } from "@/components/forms/primeiro-acesso-form";
import { RedefinirSenhaForm } from "@/components/forms/redefinir-senha-form";
import { SidebarMenuSkeleton } from "@/components/ui/sidebar";

import { useAvatarUpload as useAvatarUploadAdmin } from "@/domains/admin/perfil/usuario/hooks/useAvatarUpload";
import { useAvatarUpload as useAvatarUploadPrivate } from "@/domains/private/perfil/usuario/hooks/useAvatarUpload";
import { useIsMobile } from "@/hooks/use-mobile";

import { BannerCarouselModal as CarrosselAdmin } from "@/features/admin/banner/components/BannerCarouselModal";
import { BannerCarouselModal as CarrosselPrivate } from "@/features/private/banner/components/BannerCarouselModal";

// ---------------------------------------------------------------- useWatch nos formulários de senha
describe.each([
  ["primeiro acesso", PrimeiroAcessoForm],
  ["redefinir senha", RedefinirSenhaForm],
])("formulário de senha (%s): requisitos reagem ao que é digitado", (_nome, Formulario) => {
  it("marca cada requisito como atendido conforme a senha digitada", async () => {
    render(<Formulario onSubmit={vi.fn()} />);

    const cor = (texto: string) => screen.getByText(texto).className;
    expect(cor("Mínimo 8 caracteres")).toContain("text-muted-foreground");

    await userEvent.type(screen.getByLabelText("Nova senha"), "abc");
    expect(cor("Letra minúscula")).toContain("text-emerald-700");
    expect(cor("Letra maiúscula")).toContain("text-muted-foreground");
    expect(cor("Mínimo 8 caracteres")).toContain("text-muted-foreground");

    await userEvent.type(screen.getByLabelText("Nova senha"), "DEF123!x");
    for (const requisito of ["Mínimo 8 caracteres", "Letra maiúscula", "Letra minúscula", "Número", "Caractere especial"]) {
      expect(cor(requisito)).toContain("text-emerald-700");
    }
  });
});

// ---------------------------------------------------------------- useIsMobile (useSyncExternalStore)
describe("useIsMobile", () => {
  const definirLargura = (largura: number) => Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: largura });
  let aoMudar: (() => void) | undefined;

  beforeEach(() => {
    aoMudar = undefined;
    window.matchMedia = vi.fn().mockImplementation(() => ({
      addEventListener: (_evento: string, cb: () => void) => { aoMudar = cb; },
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => definirLargura(1024));

  it("é falso em tela larga e verdadeiro em tela estreita", () => {
    definirLargura(1024);
    expect(renderHook(() => useIsMobile()).result.current).toBe(false);

    definirLargura(500);
    expect(renderHook(() => useIsMobile()).result.current).toBe(true);
  });

  it("acompanha a mudança do tamanho da tela (evento da media query)", () => {
    definirLargura(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    definirLargura(400);
    act(() => aoMudar?.());

    expect(result.current).toBe(true);
  });
});

// ---------------------------------------------------------------- useAvatarUpload (useSyncedState)
describe.each([
  ["admin", useAvatarUploadAdmin],
  ["private", useAvatarUploadPrivate],
])("useAvatarUpload (%s)", (_nome, useAvatarUpload) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
  );

  it("começa com o avatar recebido e acompanha quando ele muda", () => {
    const { result, rerender } = renderHook(({ avatar }) => useAvatarUpload(avatar), {
      wrapper,
      initialProps: { avatar: "/storage/avatars/a.png" as string | null },
    });
    expect(result.current.avatar).toBe("/storage/avatars/a.png");

    rerender({ avatar: "/storage/avatars/b.png" });
    expect(result.current.avatar).toBe("/storage/avatars/b.png");

    rerender({ avatar: null });
    expect(result.current.avatar).toBeNull();
  });
});

// ---------------------------------------------------------------- carrossel: volta ao início quando os banners mudam
describe.each([
  ["admin", CarrosselAdmin],
  ["private", CarrosselPrivate],
])("BannerCarouselModal (%s): reset ao trocar os banners", (_nome, Carrossel) => {
  const campanha = (id: string, titulo: string, imagens: string[]) => ({
    id,
    titulo,
    conteudo: null,
    imagens: imagens.map((url, i) => ({ id: `${id}-${i}`, url, ordem: i + 1 })),
    links: [],
  });

  it("volta para a primeira imagem quando chega um novo conjunto de banners", async () => {
    const primeiros = [campanha("b1", "Campanha 1", ["/storage/1.png", "/storage/2.png"])];
    const { rerender } = render(<Carrossel banners={primeiros} open onClose={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: "Próxima imagem" }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();

    // mesmo conjunto (mesma referência): o índice NÃO é reiniciado
    rerender(<Carrossel banners={primeiros} open onClose={() => {}} />);
    expect(screen.getByText("2 / 2")).toBeInTheDocument();

    // novo conjunto (novo login): volta ao início
    const novos = [campanha("b2", "Campanha 2", ["/storage/3.png", "/storage/4.png"])];
    rerender(<Carrossel banners={novos} open onClose={() => {}} />);

    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Campanha 2" })[0]).toHaveAttribute("src", "/storage/3.png");
  });
});

// ---------------------------------------------------------------- skeleton do sidebar (sem Math.random)
describe("SidebarMenuSkeleton", () => {
  const larguraDe = (container: HTMLElement) =>
    parseInt(container.querySelector<HTMLElement>("[data-sidebar='menu-skeleton-text'], [data-slot='sidebar-menu-skeleton'] [style]")?.style.getPropertyValue("--skeleton-width") ?? "", 10);

  it("usa uma largura entre 50% e 89% que não muda entre renderizações", () => {
    const { container, rerender } = render(<SidebarMenuSkeleton />);
    const primeira = larguraDe(container);

    expect(primeira).toBeGreaterThanOrEqual(50);
    expect(primeira).toBeLessThanOrEqual(89);

    rerender(<SidebarMenuSkeleton />);
    expect(larguraDe(container)).toBe(primeira);
  });
});
