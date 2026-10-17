import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "@/components/data-tables/Pagination";
import { gerarPaginas } from "@/components/data-tables/pagination-pages";

describe("gerarPaginas", () => {
  it("mostra todas as páginas quando são poucas", () => {
    expect(gerarPaginas(1, 1)).toEqual([1]);
    expect(gerarPaginas(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("no começo mostra o início, reticências e a ÚLTIMA página", () => {
    expect(gerarPaginas(1, 20)).toEqual([1, 2, 3, 4, 5, "reticencias-fim", 20]);
    expect(gerarPaginas(3, 20)).toEqual([1, 2, 3, 4, 5, "reticencias-fim", 20]);
  });

  it("no meio mostra a primeira, a janela ao redor da atual e a última", () => {
    expect(gerarPaginas(10, 20)).toEqual([1, "reticencias-inicio", 9, 10, 11, "reticencias-fim", 20]);
  });

  it("no fim mostra a PRIMEIRA página, reticências e o final", () => {
    expect(gerarPaginas(20, 20)).toEqual([1, "reticencias-inicio", 16, 17, 18, 19, 20]);
    expect(gerarPaginas(18, 20)).toEqual([1, "reticencias-inicio", 16, 17, 18, 19, 20]);
  });

  it("para qualquer página: sempre inclui 1, a atual e a última, em ordem, sem repetir e com tamanho constante", () => {
    for (const ultima of [8, 9, 20, 137]) {
      for (let atual = 1; atual <= ultima; atual++) {
        const itens = gerarPaginas(atual, ultima);
        const numeros = itens.filter((i): i is number => typeof i === "number");

        expect(numeros).toContain(1);
        expect(numeros).toContain(atual);
        expect(numeros).toContain(ultima);
        expect(numeros).toEqual([...numeros].sort((a, b) => a - b));
        expect(new Set(itens).size).toBe(itens.length);
        expect(itens).toHaveLength(7);
      }
    }
  });
});

describe("Pagination", () => {
  const props = { total: 200, from: 1, to: 10 };

  it("permite ir direto à última página, sem passar por todas", async () => {
    const onPageChange = vi.fn();
    render(<Pagination {...props} currentPage={1} lastPage={20} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Ir para a última página (20)" }));

    expect(onPageChange).toHaveBeenCalledWith(20);
  });

  it("permite voltar direto à primeira página", async () => {
    const onPageChange = vi.fn();
    render(<Pagination {...props} currentPage={20} lastPage={20} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Ir para a primeira página" }));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("marca a página atual, desabilita Anterior na primeira e não trata reticências como botão", () => {
    render(<Pagination {...props} currentPage={1} lastPage={20} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ir para a página 1" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("button", { name: "…" })).toBeNull();
  });

  it("não renderiza nada quando há uma página só", () => {
    const { container } = render(<Pagination {...props} currentPage={1} lastPage={1} onPageChange={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
