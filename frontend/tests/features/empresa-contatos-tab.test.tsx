/**
 * TEST-005: EmpresaContatosTab (Admin e Private). Lista, cadastro, edição e exclusão de contatos
 * (telefone com máscara / e-mail), validação do Zod, permissões e erros do backend.
 */
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const servicos = vi.hoisted(() => ({
  admin: { cadastrar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
  private: { cadastrar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
}));
const permissoes = vi.hoisted(() => ({ concedidas: true }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("sonner", () => ({ toast }));
vi.mock("@/domains/admin/empresa-contato/services/empresaContatoService", () => ({
  cadastrarEmpresaContato: servicos.admin.cadastrar,
  atualizarEmpresaContato: servicos.admin.atualizar,
  excluirEmpresaContato: servicos.admin.excluir,
}));
vi.mock("@/domains/private/empresa-contato/services/empresaContatoService", () => ({
  cadastrarEmpresaContato: servicos.private.cadastrar,
  atualizarEmpresaContato: servicos.private.atualizar,
  excluirEmpresaContato: servicos.private.excluir,
}));
vi.mock("@/app/admin/providers/admin-permission-provider", () => ({
  useAdminPermission: () => ({ can: () => permissoes.concedidas, isLoading: false }),
}));
vi.mock("@/app/(private)/providers/private-permission-provider", () => ({
  usePrivatePermission: () => ({ can: () => permissoes.concedidas, isLoading: false }),
}));

import { EmpresaContatosTab as TabAdmin } from "@/features/admin/empresa/components/EmpresaContatosTab";
import { EmpresaContatosTab as TabPrivate } from "@/features/private/empresa/components/EmpresaContatosTab";

const empresa = { id: "emp-1", nomeFantasia: "Padaria Central" };

const contatos = [
  { id: "c1", empresaId: "emp-1", tipo: "T", valor: "11987654321", ativo: true, principal: true, createdAt: "", updatedAt: null, deletedAt: null },
  { id: "c2", empresaId: "emp-1", tipo: "E", valor: "contato@padaria.com", ativo: false, principal: false, createdAt: "", updatedAt: null, deletedAt: null },
];

const areas = [
  { nome: "Admin", Tab: TabAdmin, servico: servicos.admin },
  { nome: "Private", Tab: TabPrivate, servico: servicos.private },
] as const;

beforeEach(() => {
  for (const s of [servicos.admin, servicos.private]) {
    s.cadastrar.mockReset().mockResolvedValue({});
    s.atualizar.mockReset().mockResolvedValue({});
    s.excluir.mockReset().mockResolvedValue(undefined);
  }
  toast.success.mockReset();
  toast.error.mockReset();
  permissoes.concedidas = true;
});

describe.each(areas)("EmpresaContatosTab ($nome)", ({ Tab, servico }) => {
  function montar(lista: unknown[] = contatos) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

    return render(<Tab empresa={empresa as never} contatos={lista as never} />, { wrapper });
  }

  it("sem contatos mostra o aviso e o formulário de adicionar", () => {
    montar([]);

    expect(screen.getByText("Nenhum contato adicionado.")).toBeInTheDocument();
    expect(screen.getByText("Adicionar Contato", { selector: '[data-slot="card-title"]' })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar Contato" })).toBeInTheDocument();
  });

  it("lista os contatos com tipo, valor, principal e ativo", () => {
    montar();

    const linhas = screen.getAllByRole("row").slice(1); // sem o cabeçalho
    expect(linhas).toHaveLength(2);

    expect(within(linhas[0]).getByText("Telefone")).toBeInTheDocument();
    expect(within(linhas[0]).getByText("(11) 98765-4321")).toBeInTheDocument();
    expect(within(linhas[1]).getByText("E-mail")).toBeInTheDocument();
    expect(within(linhas[1]).getByText("contato@padaria.com")).toBeInTheDocument();
    expect(within(linhas[0]).getAllByText("Sim")).toHaveLength(2); // principal e ativo
    expect(within(linhas[1]).getAllByText("Nao")).toHaveLength(2); // nem principal, nem ativo
  });

  it("telefone: aplica a máscara e cadastra com o payload correto", async () => {
    montar([]);

    await userEvent.type(screen.getByPlaceholderText("Digite o telefone"), "11987654321");
    expect(screen.getByPlaceholderText("Digite o telefone")).toHaveValue("(11) 98765-4321");

    await userEvent.click(screen.getByRole("button", { name: "Adicionar Contato" }));

    await waitFor(() => expect(servico.cadastrar).toHaveBeenCalledTimes(1));
    expect(servico.cadastrar).toHaveBeenCalledWith(
      "emp-1",
      expect.objectContaining({ tipo: "T", valor: "(11) 98765-4321", principal: false, ativo: true })
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Contato cadastrado com sucesso"));
    expect(screen.getByPlaceholderText("Digite o telefone")).toHaveValue(""); // formulário limpo
  });

  it("vazio e telefone incompleto são recusados", async () => {
    montar([]);

    await userEvent.click(screen.getByRole("button", { name: "Adicionar Contato" }));
    expect(await screen.findByText("O valor do contato e obrigatório")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("Digite o telefone"), "119876");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar Contato" }));
    expect(await screen.findByText("Informe um telefone valido")).toBeInTheDocument();

    expect(servico.cadastrar).not.toHaveBeenCalled();
  });

  it("trocar o tipo para E-mail muda o campo e valida o e-mail", async () => {
    montar([]);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "E-mail" }));

    const campo = screen.getByPlaceholderText("Digite o e-mail");
    await userEvent.type(campo, "isto-nao-e-email");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar Contato" }));

    expect(await screen.findByText("Informe um e-mail valido")).toBeInTheDocument();
    expect(servico.cadastrar).not.toHaveBeenCalled();

    await userEvent.clear(campo);
    await userEvent.type(campo, "vendas@padaria.com");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar Contato" }));

    await waitFor(() => expect(servico.cadastrar).toHaveBeenCalledTimes(1));
    expect(servico.cadastrar).toHaveBeenCalledWith("emp-1", expect.objectContaining({ tipo: "E", valor: "vendas@padaria.com" }));
  });

  it("Alterar: carrega o contato no formulário e salva pelo serviço de atualização", async () => {
    montar();

    const linha = screen.getAllByRole("row")[1];
    await userEvent.click(within(linha).getByRole("button"));
    await userEvent.click(await screen.findByRole("menuitem", { name: /Alterar/ }));

    expect(screen.getByText("Editar Contato")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Digite o telefone")).toHaveValue("(11) 98765-4321");
    expect(screen.getByRole("button", { name: "Salvar Alterações" })).toBeInTheDocument();

    await userEvent.clear(screen.getByPlaceholderText("Digite o telefone"));
    await userEvent.type(screen.getByPlaceholderText("Digite o telefone"), "1133334444");
    await userEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }));

    await waitFor(() => expect(servico.atualizar).toHaveBeenCalledTimes(1));
    expect(servico.atualizar).toHaveBeenCalledWith("emp-1", "c1", expect.objectContaining({ tipo: "T", valor: "(11) 3333-4444" }));
    expect(servico.cadastrar).not.toHaveBeenCalled();
  });

  it("Cancelar a edição volta ao modo de cadastro", async () => {
    montar();

    await userEvent.click(within(screen.getAllByRole("row")[1]).getByRole("button"));
    await userEvent.click(await screen.findByRole("menuitem", { name: /Alterar/ }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByText("Adicionar Contato", { selector: '[data-slot="card-title"]' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Digite o telefone")).toHaveValue("");
  });

  it("Excluir chama o serviço de exclusão do contato certo", async () => {
    montar();

    await userEvent.click(within(screen.getAllByRole("row")[2]).getByRole("button"));
    await userEvent.click(await screen.findByRole("menuitem", { name: /Excluir/ }));

    await waitFor(() => expect(servico.excluir).toHaveBeenCalledWith("emp-1", "c2"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Contato excluído com sucesso"));
  });

  it("sem permissão não aparecem o botão de adicionar nem as ações Alterar/Excluir", async () => {
    permissoes.concedidas = false;
    montar();

    expect(screen.queryByRole("button", { name: "Adicionar Contato" })).not.toBeInTheDocument();

    await userEvent.click(within(screen.getAllByRole("row")[1]).getByRole("button"));
    expect(screen.queryByRole("menuitem", { name: /Alterar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Excluir/ })).not.toBeInTheDocument();
  });

  it("erro de negócio do backend aparece num alerta", async () => {
    servico.cadastrar.mockRejectedValue({ response: { data: { errors: { business: ["Já existe um contato principal."] } } } });
    montar([]);

    await userEvent.type(screen.getByPlaceholderText("Digite o telefone"), "11987654321");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar Contato" }));

    expect(await screen.findByText("Já existe um contato principal.")).toBeInTheDocument();
  });

  it("erro de validação do backend por campo aparece no próprio campo", async () => {
    servico.cadastrar.mockRejectedValue({ response: { data: { errors: { valor: ["Telefone já cadastrado."] } } } });
    montar([]);

    await userEvent.type(screen.getByPlaceholderText("Digite o telefone"), "11987654321");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar Contato" }));

    expect(await screen.findByText("Telefone já cadastrado.")).toBeInTheDocument();
  });
});
