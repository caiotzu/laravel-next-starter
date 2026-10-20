/**
 * NavMain (menu lateral): abre automaticamente o menu que contém a rota ativa, e o mantém
 * aberto depois. Garante o comportamento preservado na troca do useEffect por ajuste de estado
 * durante a renderização (FRONT-003). Roda para os dois contextos (Admin e Private).
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pathnameAtual = vi.hoisted(() => ({ valor: "/" }));
const permissao = vi.hoisted(() => ({ can: (_chave: string) => true, isLoading: false }));

vi.mock("next/navigation", () => ({ usePathname: () => pathnameAtual.valor }));
vi.mock("@/app/(private)/providers/private-permission-provider", () => ({ usePrivatePermission: () => permissao }));
vi.mock("@/app/admin/providers/admin-permission-provider", () => ({ useAdminPermission: () => permissao }));

import { NavMain as NavMainPrivate } from "@/app/(private)/_components/layouts/nav-main";
import { NavMain as NavMainAdmin } from "@/app/admin/_components/layouts/nav-main";

import { SidebarProvider } from "@/components/ui/sidebar";

const itens = [
  { title: "Cadastros", items: [{ title: "Usuários", url: "/usuarios" }, { title: "Grupos", url: "/grupos" }] },
  { title: "Relatórios", items: [{ title: "Auditoria", url: "/auditoria", permission: "x.auditoria.listar" }] },
];

beforeEach(() => {
  pathnameAtual.valor = "/";
  permissao.can = () => true;
  permissao.isLoading = false;
  window.matchMedia = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

describe.each([
  ["admin", NavMainAdmin],
  ["private", NavMainPrivate],
])("NavMain (%s)", (_nome, NavMain) => {
  const montar = () =>
    render(
      <SidebarProvider>
        <NavMain items={itens} />
      </SidebarProvider>
    );

  it("abre o menu que contém a rota ativa e deixa os outros fechados", () => {
    pathnameAtual.valor = "/grupos";
    montar();

    expect(screen.getByRole("link", { name: "Usuários" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Grupos" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Auditoria" })).not.toBeInTheDocument();
  });

  it("ao navegar para outro menu, abre o novo e mantém o anterior aberto", () => {
    pathnameAtual.valor = "/usuarios";
    const { rerender } = montar();
    expect(screen.queryByRole("link", { name: "Auditoria" })).not.toBeInTheDocument();

    pathnameAtual.valor = "/auditoria";
    rerender(
      <SidebarProvider>
        <NavMain items={itens} />
      </SidebarProvider>
    );

    expect(screen.getByRole("link", { name: "Auditoria" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Usuários" })).toBeInTheDocument();
  });

  it("o usuário ainda pode fechar e abrir um menu manualmente", async () => {
    pathnameAtual.valor = "/usuarios";
    montar();

    await userEvent.click(screen.getByRole("button", { name: "Cadastros" }));
    await waitFor(() => expect(screen.queryByRole("link", { name: "Usuários" })).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Cadastros" }));
    expect(await screen.findByRole("link", { name: "Usuários" })).toBeInTheDocument();
  });

  it("esconde o menu pai quando nenhum submenu é permitido, e não renderiza nada enquanto carrega", () => {
    permissao.can = (chave) => chave !== "x.auditoria.listar";
    const { unmount } = montar();
    expect(screen.queryByRole("button", { name: "Relatórios" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastros" })).toBeInTheDocument();
    unmount();

    permissao.isLoading = true;
    const carregando = montar();
    expect(carregando.container.querySelector("[data-sidebar='group']")).toBeNull();
  });
});
