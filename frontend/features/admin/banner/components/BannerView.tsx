"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Banner } from "@/domains/admin/banner/types/banner.model";
import { formatDate } from "@/lib/utils";


interface Props {
  banner: Banner;
}

export function BannerView({ banner }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {banner.titulo}
            <Badge variant={banner.status === "ativo" ? "default" : "secondary"}>
              {banner.statusLabel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {banner.conteudo && <p className="text-sm text-muted-foreground">{banner.conteudo}</p>}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <div>
              <p className="text-muted-foreground">Direcionamento</p>
              <p className="font-medium">
                {banner.direcionamento.tipoLabel}
                {banner.direcionamento.entidadeTipo && ` (${banner.direcionamento.entidadeTipo})`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Início</p>
              <p className="font-medium">{formatDate(banner.inicioEm)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Término</p>
              <p className="font-medium">{banner.fimEm ? formatDate(banner.fimEm) : "Sem data definida"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Criado em</p>
              <p className="font-medium">{formatDate(banner.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imagens ({banner.imagens.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {banner.imagens.map((imagem, index) => (
              <div key={imagem.id} className="relative aspect-video overflow-hidden rounded-lg border">
                <Image
                  src={imagem.url}
                  alt={`Imagem ${index + 1} de ${banner.titulo}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links ({banner.links.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {banner.links.length === 0 && (
            <p className="text-sm text-muted-foreground">Este banner não possui links.</p>
          )}

          <ul className="space-y-2">
            {banner.links.map((link) => (
              <li key={link.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span className="font-medium">{link.nome}</span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground underline hover:text-foreground"
                >
                  {link.url}
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
