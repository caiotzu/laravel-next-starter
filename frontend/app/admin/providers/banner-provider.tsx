"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

import { useBannersDisponiveis } from "@/domains/admin/banner/hooks/useBannersDisponiveis";
import { bannerFoiFechadoNestaSessao, marcarBannerFechadoNestaSessao } from "@/lib/banner/banner-sessao-storage";
import { protectedRoutes } from "@/routes/routes";

import { BannerCarouselModal } from "@/features/admin/banner/components/BannerCarouselModal";

// Ver banner-sessao-storage.ts e app/admin/page.tsx (marcarNovoLogin).
const PREFIXO_SESSAO = "admin";

/**
 * Espelha `app/(private)/providers/banner-provider.tsx` — mesma lógica,
 * trocando apenas o cookie/rota de referência para o Admin (ver item 8 do
 * pedido: antes não existia NENHUM provider/consulta de banners para o
 * Admin, então um banner direcionado ao público admin nunca era buscado,
 * mesmo estando corretamente configurado).
 *
 * "Fechado" é resolvido a partir de `banner-sessao-storage.ts`
 * (compartilhado com o Private) — reload, remontagem, navegação e
 * re-render nunca fazem o Banner reaparecer; só um login novo faz (ver
 * item 1 do pedido).
 */
function exigePermissoesAdmin(pathname: string): boolean {
  return protectedRoutes.some(
    (route) =>
      route.cookieName === "admin_access_token" &&
      route.protected &&
      route.regex?.test(pathname)
  );
}

/**
 * Monta a consulta de banners disponíveis UMA ÚNICA VEZ por sessão de
 * navegação no layout persistente do Admin e exibe o carousel/modal
 * quando há algo para mostrar — mesmo comportamento do BannerProvider do
 * Private (ver item 8 do pedido: "o comportamento deve ser consistente
 * com os demais públicos existentes").
 */
export function BannerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const habilitado = exigePermissoesAdmin(pathname);

  const { data: banners = [] } = useBannersDisponiveis({ enabled: habilitado });

  const [fechado, setFechado] = useState(() =>
    bannerFoiFechadoNestaSessao(PREFIXO_SESSAO)
  );
  const [visivel, setVisivel] = useState(false);

  const eraProtegidaAnteriormente = useRef(habilitado);

  useEffect(() => {
    const entrouAgoraEmRotaProtegida = habilitado && !eraProtegidaAnteriormente.current;

    if (entrouAgoraEmRotaProtegida) {
      setFechado(bannerFoiFechadoNestaSessao(PREFIXO_SESSAO));
    }

    eraProtegidaAnteriormente.current = habilitado;
  }, [habilitado]);

  useEffect(() => {
    if (banners.length > 0 && !fechado) {
      setVisivel(true);
    }

    if (banners.length === 0) {
      setVisivel(false);
    }
  }, [banners, fechado]);

  function fechar() {
    setVisivel(false);
    marcarBannerFechadoNestaSessao(PREFIXO_SESSAO);
    setFechado(true);
  }

  return (
    <>
      {children}
      <BannerCarouselModal banners={banners} open={visivel} onClose={fechar} />
    </>
  );
}
