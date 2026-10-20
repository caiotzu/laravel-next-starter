import { useEffect } from "react";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSyncedState } from "@/hooks/use-synced-state";

describe("useSyncedState", () => {
  it("começa com o valor recebido", () => {
    const { result } = renderHook(() => useSyncedState("a"));

    expect(result.current[0]).toBe("a");
  });

  it("permite alterar o estado localmente enquanto o valor externo não muda", () => {
    const { result, rerender } = renderHook(({ valor }) => useSyncedState(valor), {
      initialProps: { valor: "a" },
    });

    act(() => result.current[1]("local"));
    rerender({ valor: "a" });

    expect(result.current[0]).toBe("local");
  });

  it("volta a seguir o valor externo quando ele muda", () => {
    const { result, rerender } = renderHook(({ valor }) => useSyncedState(valor), {
      initialProps: { valor: "a" },
    });

    act(() => result.current[1]("local"));
    rerender({ valor: "b" });

    expect(result.current[0]).toBe("b");
  });

  it("nunca confirma (commit) o valor antigo depois que o externo mudou", () => {
    const confirmados: string[] = [];
    const { rerender } = renderHook(
      ({ valor }) => {
        const [estado] = useSyncedState(valor);
        // useEffect só roda para renderizações confirmadas; a passada descartada pelo React não conta.
        useEffect(() => {
          confirmados.push(estado);
        });
        return estado;
      },
      { initialProps: { valor: "a" } }
    );

    rerender({ valor: "b" });

    expect(confirmados).toEqual(["a", "b"]);
  });

  it("aceita atualização funcional e null", () => {
    const { result } = renderHook(() => useSyncedState<string | null>(null));

    act(() => result.current[1]((anterior) => (anterior ?? "") + "x"));

    expect(result.current[0]).toBe("x");
  });
});
