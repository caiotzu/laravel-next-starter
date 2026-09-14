"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { Banner } from "@/domains/private/banner/types/banner.model";
import { cn } from "@/lib/utils";


interface Props {
  banners: Banner[];
  open: boolean;
  onClose: () => void;
}

/**
 * Exibição dos banners no Private: um banner/carousel de campanha, no
 * estilo do que se vê em sites e sistemas comerciais — não uma imagem
 * dentro de um modal administrativo. Construído em cima do Dialog já
 * existente no projeto, sem nenhuma dependência de carousel nova.
 *
 * A hierarquia CAMPANHA → IMAGENS é representada com dois controles
 * visualmente distintos, nunca misturados (ver item 10 do pedido):
 *  - as ABAS no topo trocam de CAMPANHA (só aparecem quando há mais de
 *    uma) e mostram quantas campanhas existem;
 *  - as setas sobre a imagem e os pontinhos abaixo dela trocam de IMAGEM
 *    dentro da campanha atual.
 */
export function BannerCarouselModal({ banners, open, onClose }: Props) {
  const [bannerIndex, setBannerIndex] = useState(0);
  const [imagemIndex, setImagemIndex] = useState(0);

  // Sempre que o conjunto de banners elegíveis mudar (ex.: novo login),
  // volta para o início em vez de manter um índice de uma sessão anterior.
  useEffect(() => {
    setBannerIndex(0);
    setImagemIndex(0);
  }, [banners]);

  const banner = banners[bannerIndex];
  const imagem = banner?.imagens[imagemIndex];

  const temMultiplosBanners = banners.length > 1;
  const temMultiplasImagens = (banner?.imagens.length ?? 0) > 1;

  function selecionarBanner(indice: number) {
    setBannerIndex(indice);
    setImagemIndex(0);
  }

  function irParaImagem(indice: number) {
    const total = banner?.imagens.length ?? 1;
    setImagemIndex(((indice % total) + total) % total);
  }

  if (!banner || !imagem) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl sm:rounded-2xl border-none shadow-2xl"
      >
        <DialogTitle className="sr-only">{banner.titulo}</DialogTitle>

        {/* Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
        >
          <X className="h-4 w-4" />
        </button>

        {temMultiplosBanners && (
          <div className="border-b bg-muted/40 px-4 py-2.5">
            <div className="flex items-center gap-3 overflow-x-auto">
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {banners.length} campanhas: 
              </span>

              <div className="flex shrink-0 items-center gap-2">
                {banners.map((banner, index) => {
                  const selecionado = index === bannerIndex

                  return (
                    <button
                      key={banner.id}
                      type="button"
                      onClick={() => selecionarBanner(index)}
                      aria-current={selecionado ? "true" : undefined}
                      className={cn(
                        "min-h-9 shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium",
                        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selecionado
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {banner.titulo}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Área de destaque da campanha — canvas um pouco maior (item 6)
            para dar mais destaque ao banner, sem depender de uma altura
            fixa: continua sendo uma proporção (aspect-ratio), então
            cresce/encolhe de forma responsiva, sem tomar conta da tela em
            telas pequenas. */}
        <div className="relative aspect-[4/3] w-full bg-muted sm:aspect-[16/9] lg:aspect-[2/1]">
          {/* Camada de fundo: uma cópia borrada e ampliada da MESMA
              imagem, só para preencher visualmente as laterais/topo sem
              deixar barras vazias — não é a imagem "real" exibida ao
              usuário, por isso é puramente decorativa (aria-hidden). */}
          <Image
            key={`${imagem.id}-fundo`}
            src={imagem.url}
            alt=""
            aria-hidden="true"
            fill
            unoptimized
            className="scale-110 object-cover opacity-40 blur-2xl"
          />

          {/* Imagem real: `object-contain` respeita a proporção original
              enviada pelo usuário — nunca corta nem estica (ver item 3
              do pedido), qualquer que seja a proporção da imagem. */}
          <Image
            key={imagem.id}
            src={imagem.url}
            alt={banner.titulo}
            fill
            unoptimized
            priority
            className="object-contain"
          />

          {/* Gradiente para dar leitura ao contador/título sobre a imagem */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

          {temMultiplasImagens && (
            <>
              <button
                type="button"
                onClick={() => irParaImagem(imagemIndex - 1)}
                aria-label="Imagem anterior"
                className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => irParaImagem(imagemIndex + 1)}
                aria-label="Próxima imagem"
                className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                {banner.imagens.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => irParaImagem(index)}
                    aria-label={`Ir para imagem ${index + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === imagemIndex ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                    )}
                  />
                ))}
              </div>

              <div className="absolute right-3 top-3 z-20 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {imagemIndex + 1} / {banner.imagens.length}
              </div>
            </>
          )}
        </div>

        {/* Conteúdo da campanha */}
        <div className="space-y-3 p-5 sm:p-6">
          <h2 className="text-xl font-semibold tracking-tight">{banner.titulo}</h2>

          {banner.conteudo && (
            <p className="whitespace-pre-line text-sm text-muted-foreground">{banner.conteudo}</p>
          )}

          {banner.links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {/* Mesmo `variant` para todos os botões, independentemente
                  da posição/quantidade — antes o primeiro usava "default"
                  e os demais "outline", dando estilos diferentes para
                  botões do mesmo banner (ver item 5 do pedido). */}
              {banner.links.map((link) => (
                <Button key={link.id} asChild variant="default">
                  <a href={link.url} target="_blank" rel="noreferrer">
                    {link.nome}
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
