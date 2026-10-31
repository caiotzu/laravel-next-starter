/**
 * TEST-005: EmpresaFormEdit (Admin e Private). Dados vindos da empresa, abas, validação do Zod,
 * regra do status (empresa "pendente" não tem o status editado), permissão e erros do backend.
 * As abas de Endereços e Contatos têm testes próprios e aqui viram duplos simples.
 */
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const editar = vi.hoisted(() => ({ admin: vi.fn(), private: vi.fn() }));
const estado = vi.hoisted(() => ({ pode: true }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("sonner", () => ({ toast }));
vi.mock("@/domains/admin/empresa/hooks/useEmpresas", () => ({ useEmpresas: () => ({ data: { data: [] }, isLoading: false }) }));
vi.mock("@/domains/private/empresa/hooks/useEmpresas", () => ({ useEmpresas: () => ({ data: { data: [] }, isLoading: false }) }));
vi.mock("@/domains/admin/empresa/services/empresaService", () => ({ editarEmpresa: editar.admin }));
vi.mock("@/domains/private/empresa/services/empresaService", () => ({ editarEmpresa: editar.private }));
vi.mock("@/app/admin/providers/admin-permission-provider", () => ({ useAdminPermission: () => ({ can: () => estado.pode, isLoading: false }) }));
vi.mock("@/app/(private)/providers/private-permission-provider", () => ({ usePrivatePermission: () => ({ can: () => estado.pode, isLoading: false }) }));
vi.mock("@/features/admin/empresa/components/EmpresaEnderecosTab", () => ({
  EmpresaEnderecosTab: ({ enderecos }: { enderecos: unknown[] }) => <div>Aba endereços: {enderecos.length}</div>,
}));
vi.mock("@/features/private/empresa/components/EmpresaEnderecosTab", () => ({
  EmpresaEnderecosTab: ({ enderecos }: { enderecos: unknown[] }) => <div>Aba endereços: {enderecos.length}</div>,
}));
vi.mock("@/features/admin/empresa/components/EmpresaContatosTab", () => ({
  EmpresaContatosTab: ({ contatos }: { contatos: unknown[] }) => <div>Aba contatos: {contatos.length}</div>,
}));
vi.mock("@/features/private/empresa/components/EmpresaContatosTab", () => ({
  EmpresaContatosTab: ({ contatos }: { contatos: unknown[] }) => <div>Aba contatos: {contatos.length}</div>,
}));

import { EmpresaFormEdit as EditAdmin } from "@/features/admin/empresa/components/EmpresaFormEdit";
import { EmpresaFormEdit as EditPrivate } from "@/features/private/empresa/components/EmpresaFormEdit";

const empresaBase = {
  id: "emp-1",
  grupoEmpresaId: "bbbbbbbb-0000-4000-8000-000000000002",
  matrizId: null,
  cnpj: "11222333000181",
  nomeFantasia: "Padaria Central",
  razaoSocial: "Padaria Central LTDA",
  inscricaoEstadual: "123456",
  inscricaoMunicipal: null,
  status: "ativo" as const,
  uf: "MG",
  createdAt: "2026-01-01",
  updatedAt: null,
  deletedAt: null,
  grupoEmpresa: { id: "bbbbbbbb-0000-4000-8000-000000000002", nome: "Grupo Alfa" },
  contatos: [{ id: "c1" }, { id: "c2" }],
  enderecos: [{ id: "e1" }],
};

const areas = [
  { nome: "Admin", Edit: EditAdmin, editar: editar.admin, cnpjEditavel: true },
  { nome: "Private", Edit: EditPrivate, editar: editar.private, cnpjEditavel: false },
] as const;

beforeEach(() => {
  editar.admin.mockReset().mockResolvedValue({});
  editar.private.mockReset().mockResolvedValue({});
  toast.success.mockReset();
  estado.pode = true;
});

describe.each(areas)("EmpresaFormEdit ($nome)", ({ Edit, editar: servico, cnpjEditavel }) => {
  function montar(empresa: Record<string, unknown> = empresaBase) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

    return render(<Edit empresa={empresa as never} />, { wrapper });
  }

  it("vem preenchido com os dados da empresa e mostra as 3 abas", () => {
    montar();

    expect(screen.getByText("Editar Empresa")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Dados da Empresa" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Endere[cç]os/ })).toBeEnabled();
    expect(screen.getByRole("tab", { name: "Contatos" })).toBeEnabled();
    expect(screen.getByPlaceholderText("Digite o nome fantasia")).toHaveValue("Padaria Central");
    expect(screen.getByPlaceholderText("Digite a razao social")).toHaveValue("Padaria Central LTDA");
    expect(screen.getByDisplayValue("Grupo Alfa")).toBeDisabled(); // o grupo não muda na edição
  });

  it("o CNPJ vem com máscara; no Private ele é somente leitura", () => {
    montar();

    const campo = screen.getByDisplayValue("11.222.333/0001-81");
    if (cnpjEditavel) expect(campo).toBeEnabled();
    else expect(campo).toBeDisabled();
  });

  it("a aba Endereços mostra os endereços da empresa e a aba Contatos mostra os contatos", async () => {
    montar();

    await userEvent.click(screen.getByRole("tab", { name: /Endere[cç]os/ }));
    expect(await screen.findByText("Aba endereços: 1")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Contatos" }));
    expect(await screen.findByText("Aba contatos: 2")).toBeInTheDocument();
  });

  it("apagar o nome fantasia e salvar mostra o erro e não envia", async () => {
    montar();

    await userEvent.clear(screen.getByPlaceholderText("Digite o nome fantasia"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar Empresa" }));

    expect(await screen.findByText("O nome fantasia é obrigatório")).toBeInTheDocument();
    expect(servico).not.toHaveBeenCalled();
  });

  it("alterar a razão social e salvar chama o serviço com o id da empresa e avisa o sucesso", async () => {
    montar();

    await userEvent.clear(screen.getByPlaceholderText("Digite a razao social"));
    await userEvent.type(screen.getByPlaceholderText("Digite a razao social"), "Padaria Nova LTDA");
    await userEvent.click(screen.getByRole("button", { name: "Salvar Empresa" }));

    await waitFor(() => expect(servico).toHaveBeenCalledTimes(1));
    expect(servico.mock.calls[0][0]).toBe("emp-1");
    expect(servico.mock.calls[0][1]).toEqual(expect.objectContaining({ razao_social: "Padaria Nova LTDA", nome_fantasia: "Padaria Central", uf: "MG", status: "ativo" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Empresa atualizada com sucesso"));
  });

  it("empresa PENDENTE: o status não é enviado (não pode ser editado)", async () => {
    montar({ ...empresaBase, status: "pendente" });

    await userEvent.click(screen.getByRole("button", { name: "Salvar Empresa" }));

    await waitFor(() => expect(servico).toHaveBeenCalledTimes(1));
    expect(servico.mock.calls[0][1]).not.toHaveProperty("status");
  });

  it("sem permissão de atualizar o botão Salvar não aparece", () => {
    estado.pode = false;
    montar();

    expect(screen.queryByRole("button", { name: "Salvar Empresa" })).not.toBeInTheDocument();
  });

  it("erro de negócio do backend aparece num alerta", async () => {
    servico.mockRejectedValue({ response: { data: { errors: { business: ["Empresa bloqueada para edição."] } } } });
    montar();

    await userEvent.click(screen.getByRole("button", { name: "Salvar Empresa" }));

    expect(await screen.findByText("Empresa bloqueada para edição.")).toBeInTheDocument();
  });

  it("erro genérico (sem corpo) não quebra a tela: mostra mensagem padrão", async () => {
    servico.mockRejectedValue(new Error("rede"));
    montar();

    await userEvent.click(screen.getByRole("button", { name: "Salvar Empresa" }));

    expect(await screen.findByText(/Erro ao atualizar/i)).toBeInTheDocument();
  });
});

describe("EmpresaFormEdit (Admin) — CNPJ", () => {
  it("é enviado SEM máscara (só os 14 caracteres)", async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <EditAdmin empresa={empresaBase as never} />
      </QueryClientProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Salvar Empresa" }));

    await waitFor(() => expect(editar.admin).toHaveBeenCalledTimes(1));
    expect(editar.admin.mock.calls[0][1].cnpj).toBe("11222333000181");
  });

  it("CNPJ incompleto é recusado", async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <EditAdmin empresa={empresaBase as never} />
      </QueryClientProvider>
    );

    await userEvent.clear(screen.getByDisplayValue("11.222.333/0001-81"));
    await userEvent.type(screen.getByPlaceholderText("00.000.000/0000-00"), "1122233");
    await userEvent.click(screen.getByRole("button", { name: "Salvar Empresa" }));

    expect(await screen.findByText("O CNPJ deve conter 14 digitos")).toBeInTheDocument();
    expect(editar.admin).not.toHaveBeenCalled();
  });
});
