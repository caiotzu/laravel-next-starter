import { useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReactQueryProvider } from "@/components/providers/react-query-provider";

import pacote from "../../package.json";

function Filho() {
  // Só funciona se o QueryClientProvider estiver acima na árvore.
  const cliente = useQueryClient();

  return <p>cliente: {cliente ? "ok" : "ausente"}</p>;
}

describe("ReactQueryProvider", () => {
  it("fornece o QueryClient aos filhos", () => {
    render(
      <ReactQueryProvider>
        <Filho />
      </ReactQueryProvider>
    );

    expect(screen.getByText("cliente: ok")).toBeInTheDocument();
  });

  it("não renderiza o devtools fora do ambiente de desenvolvimento", () => {
    const { container } = render(
      <ReactQueryProvider>
        <Filho />
      </ReactQueryProvider>
    );

    expect(container.querySelector(".tsqd-parent-container")).toBeNull();
    expect(document.querySelector(".tsqd-parent-container")).toBeNull();
  });
});

describe("dependências de produção", () => {
  it("o devtools do TanStack fica em devDependencies, nunca em dependencies", () => {
    expect(Object.keys(pacote.dependencies)).not.toContain("@tanstack/react-query-devtools");
    expect(Object.keys(pacote.devDependencies)).toContain("@tanstack/react-query-devtools");
  });
});
