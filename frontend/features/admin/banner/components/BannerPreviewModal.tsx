"use client";

import { BannerDisponivel } from "@/domains/admin/banner/types/banner.disponivel";

import { BannerCarouselModal } from "./BannerCarouselModal";

interface Props {
  banner: BannerDisponivel | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Preview do Banner (ver itens 2, 3 e 4 do pedido) — reaproveita o MESMO
 * modal usado na exibição real ao usuário logado (`BannerCarouselModal`),
 * passando um único banner. Isso garante que o Admin veja exatamente o
 * que será exibido de verdade, e evita ter três implementações visuais
 * diferentes para cadastro, edição e listagem — as três usam este mesmo
 * componente.
 */
export function BannerPreviewModal({ banner, open, onClose }: Props) {
  return (
    <BannerCarouselModal banners={banner ? [banner] : []} open={open} onClose={onClose} />
  );
}
