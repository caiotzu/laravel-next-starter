/**
 * FRONT-006: ao trocar a foto do perfil, a foto da sidebar (que lê o cache do usuário logado,
 * `["userAdmin"]` / `["userPrivate"]`) precisa mudar junto.
 *
 * O backend devolve o usuário embrulhado em `data` (UsuarioResource), e o proxy do BFF repassa
 * assim; por isso o mock devolve `{ data: { avatar } }`, o formato real.
 */
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const atualizarAdmin = vi.hoisted(() => vi.fn());
const atualizarPrivate = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/domains/admin/perfil/usuario/services/usuarioService", () => ({ atualizarAvatar: atualizarAdmin }));
vi.mock("@/domains/private/perfil/usuario/services/usuarioService", () => ({ atualizarAvatar: atualizarPrivate }));

import { useAvatarUpload as useAvatarAdmin } from "@/domains/admin/perfil/usuario/hooks/useAvatarUpload";
import { useAvatarUpload as useAvatarPrivate } from "@/domains/private/perfil/usuario/hooks/useAvatarUpload";
import { extrairAvatar } from "@/lib/extrair-avatar";

const VELHO = "/storage/avatars/velho.png";
const NOVO = "/storage/avatars/novo.png";

function arquivo() {
  return new File(["x"], "foto.png", { type: "image/png" });
}

function evento() {
  return { target: { files: [arquivo()] } } as unknown as React.ChangeEvent<HTMLInputElement>;
}

describe("extrairAvatar", () => {
  it("lê o formato real (embrulhado em data) e o formato plano", () => {
    expect(extrairAvatar({ data: { avatar: NOVO } })).toBe(NOVO);
    expect(extrairAvatar({ avatar: NOVO })).toBe(NOVO);
  });

  it("devolve null quando não há avatar utilizável", () => {
    expect(extrairAvatar(null)).toBeNull();
    expect(extrairAvatar({})).toBeNull();
    expect(extrairAvatar({ data: { avatar: "" } })).toBeNull();
    expect(extrairAvatar({ data: { avatar: 10 } })).toBeNull();
  });
});

describe.each([
  ["admin", useAvatarAdmin, atualizarAdmin, "userAdmin"],
  ["private", useAvatarPrivate, atualizarPrivate, "userPrivate"],
] as const)("useAvatarUpload (%s) — cache da sidebar", (_nome, useAvatarUpload, servico, chave) => {
  let client: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData([chave], { id: "u1", nome: "Maria", avatar: VELHO });
    servico.mockReset();
    // jsdom não implementa createObjectURL
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  it("atualiza o avatar do cache que alimenta a sidebar (resposta embrulhada em data)", async () => {
    servico.mockResolvedValue({ data: { id: "u1", avatar: NOVO } });
    const { result } = renderHook(() => useAvatarUpload(VELHO), { wrapper });

    await act(async () => {
      await result.current.handleAvatarChange(evento());
    });

    // jsdom nunca dispara o `onload` da imagem: o cache NÃO pode depender dele
    await waitFor(() => {
      expect(client.getQueryData<{ avatar: string }>([chave])?.avatar).toBe(NOVO);
    });
  });

  it("também funciona com a resposta em formato plano", async () => {
    servico.mockResolvedValue({ id: "u1", avatar: NOVO });
    const { result } = renderHook(() => useAvatarUpload(VELHO), { wrapper });

    await act(async () => {
      await result.current.handleAvatarChange(evento());
    });

    await waitFor(() => {
      expect(client.getQueryData<{ avatar: string }>([chave])?.avatar).toBe(NOVO);
    });
  });

  it("sem avatar utilizável na resposta, invalida o cache para buscar o usuário de novo", async () => {
    servico.mockResolvedValue({ data: {} });
    const invalidar = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useAvatarUpload(VELHO), { wrapper });

    await act(async () => {
      await result.current.handleAvatarChange(evento());
    });

    await waitFor(() => {
      expect(invalidar).toHaveBeenCalledWith({ queryKey: [chave] });
    });
  });

  it("em caso de erro mantém o cache e volta ao avatar anterior", async () => {
    servico.mockRejectedValue({ response: { data: { errors: { business: ["Falhou"] } } } });
    const { result } = renderHook(() => useAvatarUpload(VELHO), { wrapper });

    await act(async () => {
      await result.current.handleAvatarChange(evento());
    });

    await waitFor(() => expect(result.current.avatar).toBe(VELHO));
    expect(client.getQueryData<{ avatar: string }>([chave])?.avatar).toBe(VELHO);
  });
});
