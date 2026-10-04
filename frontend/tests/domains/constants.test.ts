import { describe, expect, it } from "vitest";

import { CHAMADO_STATUS } from "@/constants/chamado-status";
import { USUARIO_STATUS, USUARIO_STATUS_CLASS_TEXT } from "@/constants/usuario-status";

const modulos = import.meta.glob("@/constants/*.ts", { eager: true }) as Record<string, Record<string, unknown>>;

describe("constants", () => {
  it("todos os arquivos exportam algo", () => {
    const arquivos = Object.keys(modulos);
    expect(arquivos.length).toBeGreaterThanOrEqual(12);
    for (const [arquivo, mod] of Object.entries(modulos)) {
      expect(Object.keys(mod).length, arquivo).toBeGreaterThan(0);
    }
  });

  it("status de usuário tem rótulo e classe para cada chave", () => {
    for (const chave of Object.keys(USUARIO_STATUS)) {
      expect(USUARIO_STATUS_CLASS_TEXT[chave as keyof typeof USUARIO_STATUS]).toBeTruthy();
    }
    expect(USUARIO_STATUS.ativo).toBe("Ativo");
  });

  it("status de chamado", () => {
    expect(CHAMADO_STATUS.em_atendimento).toBe("Em atendimento");
  });
});
