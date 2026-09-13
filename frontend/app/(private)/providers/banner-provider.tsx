"use client";

import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import { useBannersDisponiveis } from "@/domains/private/banner/hooks/useBannersDisponiveis";
import { protectedRoutes } from "@/routes/routes";

import { BannerCarouselModal } from "@/features/private/banner/components/BannerCarouselModal";


const CHAVE_SESSAO_BANNERS_FECHADOS = "banners-fechados-sessao";

/**
 * Mesmo cuidado do MensagemContadorProvider/PrivatePermissionProvider: só
 * habilita a busca em rotas realmente protegidas do Private, para nunca
 * disparar a consulta de banners disponíveis em telas públicas (login,
 * recuperação de senha etc) — ver item 10 do pedido (nenhuma requisição
 * desnecessária).
 */
function exigePermissoesPrivate(pathname: string): boolean {
  return protectedRoutes.some(
    (route) =>
      route.cookieName === "private_access_token" &&
      route.protected &&
      route.regex?.test(pathname)
  );
}

function jaFechouNestaSessao(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(CHAVE_SESSAO_BANNERS_FECHADOS) === "1";
}

function marcarComoFechadoNestaSessao(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CHAVE_SESSAO_BANNERS_FECHADOS, "1");
}

/**
 * Monta a consulta de banners disponíveis UMA ÚNICA VEZ por sessão de
 * navegação no layout persistente do Private (mesmo padrão do
 * MensagemContadorProvider — ver o comentário lá para o problema que essa
 * estratégia evita) e exibe o carousel/modal quando há algo para mostrar.
 *
 * Fechar o modal não persiste no banco (ver item 14 do pedido) — só marca
 * `sessionStorage`, para não reabrir sozinho a cada navegação de tela
 * dentro da mesma aba, mas sem impedir que o banner volte a aparecer numa
 * sessão nova.
 */
export function BannerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const habilitado = exigePermissoesPrivate(pathname);

  const { data: banners = [] } = useBannersDisponiveis({ enabled: habilitado });

  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (banners.length > 0 && !jaFechouNestaSessao()) {
      setVisivel(true);
    }
  }, [banners]);

  function fechar() {
    setVisivel(false);
    marcarComoFechadoNestaSessao();
  }

  return (
    <>
      {children}
      <BannerCarouselModal banners={banners} open={visivel} onClose={fechar} />
    </>
  );
}
