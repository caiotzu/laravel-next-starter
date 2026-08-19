"use client"

import { useQuery } from "@tanstack/react-query"

import { Usuario } from "@/domains/private/perfil/usuario/types/usuario.model";
import { proxyPrivateRequest } from "@/lib/proxy-private";

/**
 * Dados do acesso de suporte ativo, conforme confirmados pelo backend em
 * `/me` (ver AuthController::me()). É a fonte da verdade usada pelo
 * AcessoSuporteBootstrap para corrigir o placeholder inicial (id vindo da
 * URL) com o `expiraEm`/entidade reais — nunca inventados no frontend.
 */
export interface AcessoSuporteSessao {
  id: string;
  entidade_nome: string | null;
  expira_em: string | null;
}

export type UsuarioComAcessoSuporte = Usuario & {
  acesso_suporte?: AcessoSuporteSessao | null;
};

export function useUserPrivate(options?: { enabled?: boolean }) {
  return useQuery<UsuarioComAcessoSuporte>({
    queryKey: ["userPrivate"],
    queryFn: async () => {
      const res = await proxyPrivateRequest<{ data: UsuarioComAcessoSuporte }>({
        url: "/me",
        method: "GET",
      })

      return res.data.data;
    },
    staleTime: 1000 * 60 * 5, // cache por 5 minutos
    retry: false,
    enabled: options?.enabled ?? true,
  })
}
