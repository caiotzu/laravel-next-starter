import { beforeEach, describe, expect, it, vi } from "vitest";

const privateReq = vi.fn();
const adminReq = vi.fn();
vi.mock("@/lib/proxy-private", () => ({ proxyPrivateRequest: (...a: unknown[]) => privateReq(...a) }));
vi.mock("@/lib/proxy-admin", () => ({ proxyAdminRequest: (...a: unknown[]) => adminReq(...a) }));

beforeEach(() => {
  privateReq.mockReset().mockResolvedValue({ status: 200, data: { data: [] } });
  adminReq.mockReset().mockResolvedValue({ status: 200, data: { data: [] } });
});

describe("serviços de perfil (avatar)", () => {
  it("private: PATCH /perfil/avatar com o base64", async () => {
    const { atualizarAvatar } = await import("@/domains/private/perfil/usuario/services/usuarioService");
    privateReq.mockResolvedValue({ status: 200, data: { avatar: "/storage/avatars/a.png" } });

    const r = await atualizarAvatar({ avatar: "AAAA" });

    expect(privateReq).toHaveBeenCalledWith({ url: "/perfil/avatar", method: "PATCH", data: { avatar: "AAAA" } });
    expect(r).toEqual({ avatar: "/storage/avatars/a.png" });
  });

  it("admin: usa o proxy admin", async () => {
    const { atualizarAvatar } = await import("@/domains/admin/perfil/usuario/services/usuarioService");
    adminReq.mockResolvedValue({ status: 200, data: { avatar: "x" } });

    await atualizarAvatar({ avatar: "AAAA" });

    expect(adminReq).toHaveBeenCalledWith(expect.objectContaining({ url: "/admin/perfil/avatar", method: "PATCH" }));
    expect(privateReq).not.toHaveBeenCalled();
  });
});

describe("serviços de banner", () => {
  it("private: lista os banners disponíveis e mapeia", async () => {
    privateReq.mockResolvedValue({
      status: 200,
      data: { data: [{ id: "1", titulo: "T", conteudo: null, imagens: [{ id: "i", url: "/storage/x.png", ordem: 1 }], links: [] }] },
    });
    const { listarBannersDisponiveis } = await import("@/domains/private/banner/services/bannerService");

    const r = await listarBannersDisponiveis();

    expect(privateReq).toHaveBeenCalledWith({ url: "/banners/disponiveis", method: "GET" });
    expect(r[0].imagens[0].url).toBe("/storage/x.png");
  });
});
