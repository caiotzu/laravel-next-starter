/**
 * TEST-005: EmpresaFormCreate (Admin). Abas, validação do Zod (CNPJ, UF, campos obrigatórios),
 * permissão no botão e payload entregue a `onSubmit`.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const estado = vi.hoisted(() => ({ carregando: false, pode: true }));

vi.mock("@/domains/admin/empresa/hooks/useEmpresas", () => ({
  useEmpresas: () => ({
    data: { data: [{ id: "aaaaaaaa-0000-4000-8000-000000000001", nomeFantasia: "Matriz SA" }] },
    isLoading: estado.carregando,
  }),
}));
vi.mock("@/domains/admin/grupo-empresa/hooks/useGrupoEmpresas", () => ({
  useGrupoEmpresas: () => ({
    data: { data: [{ id: "bbbbbbbb-0000-4000-8000-000000000002", nome: "Grupo Alfa" }] },
    isLoading: estado.carregando,
  }),
}));
vi.mock("@/app/admin/providers/admin-permission-provider", () => ({
  useAdminPermission: () => ({ can: () => estado.pode, isLoading: false }),
}));

import { EmpresaFormCreate } from "@/features/admin/empresa/components/EmpresaFormCreate";

const onSubmit = vi.fn();

beforeEach(() => {
  onSubmit.mockReset().mockResolvedValue(undefined);
  estado.carregando = false;
  estado.pode = true;
});

const montar = (props: Partial<Parameters<typeof EmpresaFormCreate>[0]> = {}) =>
  render(<EmpresaFormCreate onSubmit={onSubmit} {...props} />);

async function escolher(placeholder: string, opcao: string) {
  await userEvent.click(screen.getByPlaceholderText(placeholder));
  await userEvent.click(await screen.findByRole("option", { name: opcao }));
}

async function preencherValido(cnpj = "11222333000181") {
  await escolher("Digite o nome da grupo empresa...", "Grupo Alfa");
  await userEvent.type(screen.getByPlaceholderText("00.000.000/0000-00"), cnpj);
  await userEvent.type(screen.getByPlaceholderText("Digite o nome fantasia"), "Padaria Central");
  await userEvent.type(screen.getByPlaceholderText("Digite a razao social"), "Padaria Central LTDA");
  await escolher("Selecione a UF", "MG - Minas Gerais");
}

describe("EmpresaFormCreate", () => {
  it("mostra o esqueleto enquanto carrega os grupos e as matrizes", () => {
    estado.carregando = true;
    montar();

    expect(screen.queryByText("Cadastrar Empresa")).not.toBeInTheDocument();
  });

  it("renderiza as 3 abas: só 'Dados da Empresa' está ativa no cadastro", () => {
    montar();

    expect(screen.getByRole("tab", { name: "Dados da Empresa" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Endereços" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Contatos" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", "/admin/empresas");
  });

  it("enviar vazio mostra todos os obrigatórios e não envia", async () => {
    montar();

    await userEvent.click(screen.getByRole("button", { name: "Cadastrar Empresa" }));

    expect(await screen.findByText("O grupo da empresa é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("O CNPJ é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("O nome fantasia é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("A razao social é obrigatória")).toBeInTheDocument();
    expect(screen.getByText("A UF é obrigatória")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("CNPJ com menos de 14 caracteres é recusado", async () => {
    montar();
    await preencherValido("1122233300");

    await userEvent.click(screen.getByRole("button", { name: "Cadastrar Empresa" }));

    expect(await screen.findByText("O CNPJ deve conter 14 dígitos")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("o campo CNPJ aplica a máscara enquanto digita", async () => {
    montar();

    await userEvent.type(screen.getByPlaceholderText("00.000.000/0000-00"), "11222333000181");

    expect(screen.getByPlaceholderText("00.000.000/0000-00")).toHaveValue("11.222.333/0001-81");
  });

  it("preenchido corretamente envia grupo, CNPJ mascarado, nomes e UF", async () => {
    montar();
    await preencherValido();

    await userEvent.click(screen.getByRole("button", { name: "Cadastrar Empresa" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        grupo_empresa_id: "bbbbbbbb-0000-4000-8000-000000000002",
        cnpj: "11.222.333/0001-81",
        nome_fantasia: "Padaria Central",
        razao_social: "Padaria Central LTDA",
        uf: "MG",
      })
    );
  });

  it("matriz é opcional: enviar sem matriz funciona", async () => {
    montar();
    await preencherValido();

    await userEvent.click(screen.getByRole("button", { name: "Cadastrar Empresa" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].matriz_id).toBeUndefined();
  });

  it("sem a permissão admin.empresa.cadastrar o botão de cadastrar não aparece", () => {
    estado.pode = false;
    montar();

    expect(screen.queryByRole("button", { name: "Cadastrar Empresa" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("mostra os erros do backend e, enquanto envia, desabilita o botão", () => {
    montar({ backendErrors: ["CNPJ já cadastrado."], isLoading: true });

    expect(screen.getByText("CNPJ já cadastrado.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cadastrar Empresa/ })).toBeDisabled();
  });
});
