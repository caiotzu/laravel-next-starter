"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

import { useBannersDisponiveis } from "@/domains/admin/banner/hooks/useBannersDisponiveis";
import { protectedRoutes } from "@/routes/routes";

import { BannerCarouselModal } from "@/features/admin/banner/components/BannerCarouselModal";

/**
 * Espelha `app/(private)/providers/banner-provider.tsx` — mesma lógica,
 * trocando apenas o cookie/rota de referência para o Admin (ver item 8 do
 * pedido: antes não existia NENHUM provider/consulta de banners para o
 * Admin, então um banner direcionado ao público admin nunca era buscado,
 * mesmo estando corretamente configurado).
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

  const [fechadoNestaSessao, setFechadoNestaSessao] = useState(false);
  const [visivel, setVisivel] = useState(false);

  const eraProtegidaAnteriormente = useRef(habilitado);

  useEffect(() => {
    const entrouAgoraEmRotaProtegida = habilitado && !eraProtegidaAnteriormente.current;

    if (entrouAgoraEmRotaProtegida) {
      setFechadoNestaSessao(false);
    }

    eraProtegidaAnteriormente.current = habilitado;
  }, [habilitado]);

  useEffect(() => {
    if (banners.length > 0 && !fechadoNestaSessao) {
      setVisivel(true);
    }

    if (banners.length === 0) {
      setVisivel(false);
    }
  }, [banners, fechadoNestaSessao]);

  function fechar() {
    setVisivel(false);
    setFechadoNestaSessao(true);
  }

  return (
    <>
      {children}
      <BannerCarouselModal banners={banners} open={visivel} onClose={fechar} />
    </>
  );
}
