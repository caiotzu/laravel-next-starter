"use client";

import { useMemo, useState } from "react";

import Image from "next/image";

import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { Banner } from "@/domains/private/banner/types/banner.model";

interface Props {
  banners: Banner[];
  open: boolean;
  onClose: () => void;
}

/**
 * Exibição dos banners no Private — um "carousel/modal" profissional (ver
 * item 9 do pedido), construído em cima do Dialog já existente no projeto
 * (sem adicionar nenhuma dependência de carousel nova).
 *
 * Dois níveis de navegação, nunca misturados no mesmo controle (ver item
 * 15): as setas laterais grandes trocam de BANNER (campanha); os pontinhos
 * pequenos abaixo da imagem trocam de IMAGEM dentro do banner atual.
 */
export function BannerCarouselModal({ banners, open, onClose }: Props) {
  const [bannerIndex, setBannerIndex] = useState(0);
  const [imagemIndex, setImagemIndex] = useState(0);

  const banner = banners[bannerIndex];
  const imagem = banner?.imagens[imagemIndex];

  const temMultiplosBanners = banners.length > 1;
  const temMultiplasImagens = (banner?.imagens.length ?? 0) > 1;

  function irParaBanner(indice: number) {
    const total = banners.length;
    setBannerIndex(((indice % total) + total) % total);
    setImagemIndex(0);
  }

  function irParaImagem(indice: number) {
    const total = banner?.imagens.length ?? 1;
    setImagemIndex(((indice % total) + total) % total);
  }

  const podeVoltar = useMemo(() => temMultiplosBanners, [temMultiplosBanners]);

  if (!banner || !imagem) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl gap-0 overflow-hidden p-0 sm:rounded-xl"
      >
        <DialogTitle className="sr-only">{banner.titulo}</DialogTitle>

        {/* Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar banner"
          className="absolute right-3 top-3 z-20 rounded-full bg-black/40 p-1.5 text-white transition hover:bg-black/60"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Imagem */}
        <div className="relative aspect-[16/9] w-full bg-muted">
          <Image
            key={imagem.id}
            src={imagem.url}
            alt={banner.titulo}
            fill
            unoptimized
            priority
            className="object-cover"
          />

          {podeVoltar && (
            <>
              <button
                type="button"
                onClick={() => irParaBanner(bannerIndex - 1)}
                aria-label="Banner anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => irParaBanner(bannerIndex + 1)}
                aria-label="Próximo banner"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {temMultiplasImagens && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {banner.imagens.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => irParaImagem(index)}
                  aria-label={`Ir para imagem ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    index === imagemIndex ? "w-5 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {temMultiplosBanners && (
            <div className="absolute right-3 bottom-3 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">
              {bannerIndex + 1} / {banners.length}
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="space-y-3 p-5">
          <h2 className="text-lg font-semibold">{banner.titulo}</h2>

          {banner.conteudo && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">{banner.conteudo}</p>
          )}

          {banner.links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {banner.links.map((link) => (
                <Button key={link.id} asChild size="sm">
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
