"use client";

import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";

import { useBannersDisponiveis } from "@/domains/admin/banner/hooks/useBannersDisponiveis";
import { BannerDisponivel as Banner } from "@/domains/admin/banner/types/banner.disponivel";
import {
  consumirBannerPendente,
  existeBannerPendente,
} from "@/lib/banner/banner-sessao-storage";
import { protectedRoutes } from "@/routes/routes";

import { BannerCarouselModal } from "@/features/admin/banner/components/BannerCarouselModal";

// Ver banner-sessao-storage.ts e app/admin/page.tsx (marcarNovoLogin).
const PREFIXO_SESSAO = "admin";
const COOKIE = "admin_access_token";
const QUERY_KEY = ["banners-admin-disponiveis"];

/** Telas públicas (login/recuperação de senha) desta área. */
export function ehRotaPublica(pathname: string): boolean {
  return protectedRoutes.some(
    (route) =>
      route.cookieName === COOKIE &&
      route.isLoginRoute === true &&
      route.regex?.test(pathname)
  );
}

/**
 * O Banner é exibido SOMENTE logo após o login, uma única vez.
 *
 * O login "arma" um sinal de uso único (ver banner-sessao-storage.ts). Ao
 * entrar numa tela autenticada com o sinal armado, o provider busca os
 * banners elegíveis, mostra o carousel (se houver algo) e consome o sinal.
 * Trocar de menu, navegar, recarregar ou fechar/reabrir telas nunca arma o
 * sinal de novo — só um novo login faz isso.
 */
export function BannerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [pendente, setPendente] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [visivel, setVisivel] = useState(false);

  // Detecta o login recém-concluído (somente em telas autenticadas).
  useEffect(() => {
    if (pendente || ehRotaPublica(pathname)) return;

    if (existeBannerPendente(PREFIXO_SESSAO)) {
      // Garante dados novos do login atual, nunca um cache de login anterior.
      queryClient.removeQueries({ queryKey: QUERY_KEY });
      setPendente(true);
    }
  }, [pathname, pendente, queryClient]);

  const { data, isSuccess, isError } = useBannersDisponiveis({ enabled: pendente });

  // Resolve a consulta UMA vez e consome o sinal.
  useEffect(() => {
    if (!pendente) return;

    if (isSuccess) {
      consumirBannerPendente(PREFIXO_SESSAO);
      setPendente(false);

      if (data && data.length > 0) {
        setBanners(data);
        setVisivel(true);
      }

      return;
    }

    if (isError) {
      consumirBannerPendente(PREFIXO_SESSAO);
      setPendente(false);
    }
  }, [pendente, isSuccess, isError, data]);

  return (
    <>
      {children}
      <BannerCarouselModal
        banners={banners}
        open={visivel}
        onClose={() => setVisivel(false)}
      />
    </>
  );
}
