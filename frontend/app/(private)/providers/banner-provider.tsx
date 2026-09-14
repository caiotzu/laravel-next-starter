"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

import { useBannersDisponiveis } from "@/domains/private/banner/hooks/useBannersDisponiveis";
import { bannerFoiFechadoNestaSessao, marcarBannerFechadoNestaSessao } from "@/lib/banner/banner-sessao-storage";
import { protectedRoutes } from "@/routes/routes";

import { BannerCarouselModal } from "@/features/private/banner/components/BannerCarouselModal";

// Ver banner-sessao-storage.ts e app/(private)/page.tsx (marcarNovoLogin).
const PREFIXO_SESSAO = "private";

/**
 * Mesmo cuidado do MensagemContadorProvider/PrivatePermissionProvider: só
 * habilita a busca em rotas realmente protegidas do Private, para nunca
 * disparar a consulta de banners disponíveis em telas públicas (login,
 * recuperação de senha etc) — ver item 10 do pedido original (nenhuma
 * requisição desnecessária).
 */
function exigePermissoesPrivate(pathname: string): boolean {
  return protectedRoutes.some(
    (route) =>
      route.cookieName === "private_access_token" &&
      route.protected &&
      route.regex?.test(pathname)
  );
}

/**
 * Monta a consulta de banners disponíveis UMA ÚNICA VEZ por sessão de
 * navegação no layout persistente do Private (mesmo padrão do
 * MensagemContadorProvider) e exibe o carousel/modal quando há algo para
 * mostrar.
 *
 * "Fechado" é resolvido a partir de `banner-sessao-storage.ts` (não de
 * um estado solto em memória) — é o que garante que reload, remontagem,
 * navegação e re-render NUNCA façam o Banner reaparecer, e que só um
 * login novo o faça (ver item 1 do pedido original).
 *
 * IMPORTANTE: `app/(private)/layout.tsx` é o layout raiz de todo o app
 * (`<html>`/`<body>`), inclusive da tela de login — ele nunca desmonta
 * entre um logout e um login seguinte na mesma aba. Por isso o efeito
 * abaixo REAVALIA (não apenas "esquece") o estado de fechado sempre que
 * a navegação SAI de uma rota protegida (login/logout) e volta a ENTRAR
 * numa rota protegida (login concluído) — a fronteira de uma nova
 * sessão é exatamente onde a tela de login já terá chamado
 * `marcarNovoLogin` (ver banner-sessao-storage.ts).
 */
export function BannerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const habilitado = exigePermissoesPrivate(pathname);

  const { data: banners = [] } = useBannersDisponiveis({ enabled: habilitado });

  const [fechado, setFechado] = useState(() =>
    bannerFoiFechadoNestaSessao(PREFIXO_SESSAO)
  );
  const [visivel, setVisivel] = useState(false);

  const eraProtegidaAnteriormente = useRef(habilitado);

  useEffect(() => {
    const entrouAgoraEmRotaProtegida = habilitado && !eraProtegidaAnteriormente.current;

    if (entrouAgoraEmRotaProtegida) {
      // Fronteira de uma possível nova sessão (login concluído) —
      // reavalia contra o marcador atual em vez de assumir que mudou.
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
