/**
 * TEST-005: BannerForm (Admin). O uploader de imagens, o campo de links e o modal de preview
 * têm lógica própria e são trocados por duplos simples: o foco aqui é o formulário (validação do
 * Zod, direcionamento, datas, botão Preview e payload).
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

vi.mock("@/features/admin/banner/components/BannerImagensUploader", () => ({
  BannerImagensUploader: ({ value, disabled }: { value: unknown[]; disabled?: boolean }) => (
    <div data-testid="uploader" data-disabled={String(Boolean(disabled))}>{value.length} imagem(ns)</div>
  ),
}));
vi.mock("@/features/admin/banner/components/BannerLinksField", () => ({
  BannerLinksField: ({ value, errors }: { value: unknown[]; errors?: Record<number, { nome?: string }> }) => (
    <div data-testid="links">{value.length} link(s){errors?.[0]?.nome ? ` — ${errors[0].nome}` : ""}</div>
  ),
}));
vi.mock("@/features/admin/banner/components/BannerPreviewModal", () => ({
  BannerPreviewModal: ({ banner, open }: { banner: { titulo?: string } | null; open: boolean }) =>
    open ? <div role="dialog">Preview: {banner?.titulo}</div> : null,
}));

import { BannerForm } from "@/features/admin/banner/components/BannerForm";

const onSubmit = vi.fn();

beforeEach(() => {
  onSubmit.mockReset().mockResolvedValue(undefined);
  toast.error.mockReset();
});

const imagem = { tipo: "existente", id: "i1", url: "/storage/banners/a.png" };

function montar(props: Partial<Parameters<typeof BannerForm>[0]> = {}) {
  return render(
    <BannerForm
      title="Cadastrar Banner"
      submitLabel="Cadastrar"
      imagens={[imagem] as never}
      onImagensChange={vi.fn()}
      links={[]}
      onLinksChange={vi.fn()}
      onSubmit={onSubmit}
      {...props}
    />
  );
}

describe("BannerForm", () => {
  it("renderiza o título, os campos, as seções de imagens e links e os botões", () => {
    montar();

    expect(screen.getByText("Cadastrar Banner")).toBeInTheDocument();
    expect(screen.getByLabelText(/Título/)).toHaveValue("");
    expect(screen.getByLabelText(/Início da campanha/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Término da campanha/)).toBeInTheDocument();
    expect(screen.getByTestId("uploader")).toHaveTextContent("1 imagem(ns)");
    expect(screen.getByTestId("links")).toHaveTextContent("0 link(s)");
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
  });

  it("começa com direcionamento Todos e sem o campo Entidade", () => {
    montar();

    expect(screen.getByRole("combobox", { name: /Direcionamento/ })).toHaveTextContent("Todos");
    expect(screen.queryByLabelText(/^Entidade/)).not.toBeInTheDocument();
  });

  it("enviar vazio mostra título e início obrigatórios e não envia", async () => {
    montar();

    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("O título do banner é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("A data de início da campanha é obrigatória")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("título com mais de 120 caracteres é recusado", async () => {
    montar();

    await userEvent.click(screen.getByLabelText(/Título/));
    await userEvent.paste("x".repeat(121));
    await userEvent.type(screen.getByLabelText(/Início da campanha/), "2026-11-01T08:00");
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("O título deve ter no máximo 120 caracteres")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("término igual ou anterior ao início é recusado", async () => {
    montar();

    await userEvent.type(screen.getByLabelText(/Título/), "Black Friday");
    await userEvent.type(screen.getByLabelText(/Início da campanha/), "2026-11-10T08:00");
    await userEvent.type(screen.getByLabelText(/Término da campanha/), "2026-11-09T08:00");
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("A data de término deve ser posterior à data de início")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("campanha sem término e para todos: envia o payload", async () => {
    montar();

    await userEvent.type(screen.getByLabelText(/Título/), "Black Friday");
    await userEvent.type(screen.getByLabelText(/Conteúdo/), "Descontos de até 50%");
    await userEvent.type(screen.getByLabelText(/Início da campanha/), "2026-11-10T08:00");
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        titulo: "Black Friday",
        conteudo: "Descontos de até 50%",
        inicio_em: "2026-11-10T08:00",
        direcionamento_tipo: "geral",
      })
    );
  });

  it("direcionamento Entidade mostra o campo Entidade e o torna obrigatório", async () => {
    montar();

    await userEvent.type(screen.getByLabelText(/Título/), "Aviso");
    await userEvent.type(screen.getByLabelText(/Início da campanha/), "2026-11-10T08:00");
    await userEvent.click(screen.getByRole("combobox", { name: /Direcionamento/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Entidade" }));

    expect(await screen.findByRole("combobox", { name: /^Entidade/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("Selecione a entidade de destino")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("Preview sem imagens avisa e não abre o modal", async () => {
    montar({ imagens: [] });

    await userEvent.click(screen.getByRole("button", { name: "Preview" }));

    expect(toast.error).toHaveBeenCalledWith("Adicione ao menos uma imagem para visualizar o preview.");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Preview com imagem abre o modal com o título ATUAL do formulário (ainda não salvo)", async () => {
    montar();

    await userEvent.type(screen.getByLabelText(/Título/), "Título digitado agora");
    await userEvent.click(screen.getByRole("button", { name: "Preview" }));

    expect(await screen.findByRole("dialog")).toHaveTextContent("Preview: Título digitado agora");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("com defaultValues (edição) vem preenchido", () => {
    montar({
      title: "Editar Banner",
      submitLabel: "Salvar",
      defaultValues: { titulo: "Natal", inicio_em: "2026-12-01T00:00", direcionamento_tipo: "geral" },
    });

    expect(screen.getByText("Editar Banner")).toBeInTheDocument();
    expect(screen.getByLabelText(/Título/)).toHaveValue("Natal");
    expect(screen.getByLabelText(/Início da campanha/)).toHaveValue("2026-12-01T00:00");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("enquanto salva, desabilita os campos, o preview e repassa o estado ao uploader", () => {
    montar({ isLoading: true });

    expect(screen.getByLabelText(/Título/)).toBeDisabled();
    expect(screen.getByRole("button", { name: "Preview" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Cadastrar/ })).toBeDisabled();
    expect(screen.getByTestId("uploader")).toHaveAttribute("data-disabled", "true");
  });

  it("mostra erros do backend e os erros por link no campo de links", () => {
    montar({ backendErrors: ["Falha ao salvar o banner."], linkErrors: { 0: { nome: "Nome obrigatório" } }, links: [{} as never] });

    expect(screen.getByText("Falha ao salvar o banner.")).toBeInTheDocument();
    expect(screen.getByTestId("links")).toHaveTextContent("Nome obrigatório");
  });
});
