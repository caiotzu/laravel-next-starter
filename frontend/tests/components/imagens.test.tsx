import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: ({ fill: _f, unoptimized: _u, priority: _p, ...props }: Record<string, unknown>) => <img {...props} />,
}));

import { BannerCarouselModal } from "@/features/private/banner/components/BannerCarouselModal";
import { PerfilHeaderCard } from "@/features/private/perfil/components/PerfilHeaderCard";

const usuario = {
  id: "1",
  nome: "Maria",
  email: "m@x.com",
  avatar: "/storage/avatars/a.png",
  grupo: "Admin",
  status: "ativo",
  google2fa_enable: false,
  google2fa_confirmado_em: null,
  ultimo_login_em: null,
  ultimo_ip: null,
  permissoes: [],
};

describe("PerfilHeaderCard", () => {
  it("renderiza nome, e-mail e informações", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <PerfilHeaderCard user={usuario} />
      </QueryClientProvider>
    );

    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("m@x.com")).toBeInTheDocument();
    expect(screen.getByText("2FA habilitado")).toBeInTheDocument();
    expect(screen.getByText("Não")).toBeInTheDocument();
  });
});

describe("BannerCarouselModal", () => {
  const banners = [
    {
      id: "b1",
      titulo: "Campanha 1",
      conteudo: "Texto",
      imagens: [
        { id: "i1", url: "/storage/banners/1.png", ordem: 1 },
        { id: "i2", url: "/storage/banners/2.png", ordem: 2 },
      ],
      links: [{ id: "l1", nome: "Saiba mais", url: "https://x.com" }],
    },
    { id: "b2", titulo: "Campanha 2", conteudo: null, imagens: [{ id: "i3", url: "/storage/banners/3.png", ordem: 1 }], links: [] },
  ];

  it("usa a URL relativa nas imagens e navega entre elas", async () => {
    render(<BannerCarouselModal banners={banners} open onClose={() => {}} />);

    const imagens = screen.getAllByRole("img", { name: "Campanha 1" });
    expect(imagens[0]).toHaveAttribute("src", "/storage/banners/1.png");
    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Próxima imagem" }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Campanha 1" })[0]).toHaveAttribute("src", "/storage/banners/2.png");
  });

  it("troca de campanha e mostra os links", async () => {
    render(<BannerCarouselModal banners={banners} open onClose={() => {}} />);

    expect(screen.getByRole("link", { name: "Saiba mais" })).toHaveAttribute("href", "https://x.com");
    await userEvent.click(screen.getByRole("button", { name: "Campanha 2" }));
    expect(screen.getAllByRole("img", { name: "Campanha 2" })[0]).toHaveAttribute("src", "/storage/banners/3.png");
  });

  it("chama onClose ao fechar e não renderiza sem banners", async () => {
    const onClose = vi.fn();
    const { rerender } = render(<BannerCarouselModal banners={banners} open onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalled();

    rerender(<BannerCarouselModal banners={[]} open onClose={onClose} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
