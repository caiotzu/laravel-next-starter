"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

import { useBannersDisponiveis } from "@/domains/private/banner/hooks/useBannersDisponiveis";
import { protectedRoutes } from "@/routes/routes";

import { BannerCarouselModal } from "@/features/private/banner/components/BannerCarouselModal";


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
 * Fechar o modal não persiste em banco nem em localStorage/sessionStorage
 * (ver item 14 do pedido original) — fica só em memória (estado React),
 * para não reabrir sozinho a cada navegação de tela dentro da MESMA
 * sessão autenticada.
 *
 * IMPORTANTE: `app/(private)/layout.tsx` é o layout raiz de todo o app
 * (`<html>`/`<body>`), inclusive da tela de login — ele nunca desmonta
 * entre um logout e um login seguinte na mesma aba. Por isso o estado de
 * "fechado" não pode ficar preso para sempre: ele é resetado sempre que a
 * navegação SAI de uma rota protegida (login/logout) e volta a ENTRAR
 * numa rota protegida (login concluído) — ou seja, exatamente a fronteira
 * de uma nova sessão. Isso implementa a regra do item 14: cada novo login
 * reavalia as campanhas elegíveis, sem exigir nenhuma persistência nova.
 */
export function BannerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const habilitado = exigePermissoesPrivate(pathname);

  const { data: banners = [] } = useBannersDisponiveis({ enabled: habilitado });

  const [fechadoNestaSessao, setFechadoNestaSessao] = useState(false);
  const [visivel, setVisivel] = useState(false);

  const eraProtegidaAnteriormente = useRef(habilitado);

  useEffect(() => {
    const entrouAgoraEmRotaProtegida = habilitado && !eraProtegidaAnteriormente.current;

    if (entrouAgoraEmRotaProtegida) {
      // Fronteira de uma nova sessão (login concluído): esquece que o
      // usuário fechou o banner numa sessão anterior.
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
