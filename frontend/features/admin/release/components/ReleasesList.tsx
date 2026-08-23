"use client";

import Link from "next/link";

import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { getReleaseTipoBadge, getReleaseTipoIcon, getReleaseTipoLabel } from "@/constants/release-tipo";
import { Release } from "@/domains/admin/release/types/release.model";
import { formatDate } from "@/lib/utils";

/** Prévia em texto puro do conteúdo HTML, para a linha de resumo na listagem. */
function textoPreview(html: string): string {
  if (typeof window === "undefined") return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent?.trim() ?? "";
}

interface Props {
  releases: Release[];
  hrefBase: string;
}

export function ReleasesList({ releases, hrefBase }: Props) {
  if (releases.length === 0) {
    return (
      <Card className="flex h-full flex-col items-center justify-center gap-2 border-dashed shadow-none">
        <p className="text-sm text-muted-foreground">
          Nenhuma novidade publicada até o momento.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0 shadow-sm">
      <div className="flex-1 divide-y overflow-y-auto">
        {releases.map((release) => {
          const Icon = getReleaseTipoIcon(release.tipo);

          return (
            <Link
              key={release.id}
              href={`${hrefBase}/${release.id}`}
              className="group relative flex min-h-[104px] items-center gap-4 px-6 py-5 transition-colors hover:bg-accent/40"
            >
              {/* Barra de destaque no hover, com a cor do ícone do tipo */}
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] origin-left scale-y-0 opacity-0 transition-all duration-200 ease-out group-hover:scale-y-100 group-hover:opacity-100 ${getReleaseTipoBadge(release.tipo)}`}
                style={{ backgroundColor: "currentColor" }}
              />

              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${getReleaseTipoBadge(release.tipo)}`}
              >
                <Icon className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Badge className={`font-normal ${getReleaseTipoBadge(release.tipo)}`}>
                    {getReleaseTipoLabel(release.tipo)}
                  </Badge>
                  <Badge variant="outline">v{release.versao}</Badge>
                </div>

                <p className="truncate font-semibold leading-snug tracking-tight">
                  {release.titulo}
                </p>
                <p className="mt-1 line-clamp-2 max-w-3xl text-sm text-muted-foreground">
                  {textoPreview(release.conteudo)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDate(release.publicadoEm, false)}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}