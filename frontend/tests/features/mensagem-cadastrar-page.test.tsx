/**
 * Admin > Mensagens > Enviar mensagem: o cabeçalho da página tem o botão "Voltar" para a listagem
 * (mesmo padrão da tela de detalhe da mensagem). O layout (sidebar, cabeçalho do site, guarda de
 * permissão) e o formulário têm testes próprios e aqui viram duplos simples.
 */
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/admin/mensagens/cadastrar" }));
vi.mock("@/app/admin/_components/guard/AdminPermissionGuard", () => ({
  AdminPermissionGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/app/admin/_components/layouts/app-sidebar", () => ({ AppSidebar: () => <nav aria-label="menu" /> }));
vi.mock("@/app/admin/_components/layouts/site-header", () => ({ SiteHeader: () => <header /> }));
vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarInset: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/features/admin/mensagem/components/MensagemFormCreate", () => ({
  MensagemFormCreate: () => <form aria-label="formulário de mensagem" />,
}));

import Page from "@/app/admin/mensagens/cadastrar/page";

function montar() {
  const client = new QueryClient();

  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>
  );
}

describe("Admin > Mensagens > Enviar mensagem", () => {
  it("mostra o título, o formulário e o botão Voltar na parte superior, apontando para a listagem", () => {
    montar();

    expect(screen.getByRole("heading", { name: "Mensagens" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "formulário de mensagem" })).toBeInTheDocument();

    const voltar = screen.getByRole("link", { name: "Voltar" });
    expect(voltar).toHaveAttribute("href", "/admin/mensagens");
  });

  it("o botão Voltar vem ANTES do formulário na página", () => {
    montar();

    const voltar = screen.getByRole("link", { name: "Voltar" });
    const formulario = screen.getByRole("form", { name: "formulário de mensagem" });

    expect(voltar.compareDocumentPosition(formulario) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("o botão Voltar é um link normal (não envia nada nem dispara o formulário)", async () => {
    montar();

    await userEvent.click(screen.getByRole("link", { name: "Voltar" }));

    expect(push).not.toHaveBeenCalled();
  });
});
