"use client";

import Link from "next/link";

import { Sparkles, Wrench, Bug, RefreshCw, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { Release, ReleaseTipo } from "@/domains/private/release/types/release.model";

const TIPO_CONFIG: Record<ReleaseTipo, { icon: typeof Sparkles; label: string; className: string }> = {
  feature: { icon: Sparkles, label: "Novidade", className: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" },
  improvement: { icon: RefreshCw, label: "Melhoria", className: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" },
  fix: { icon: Bug, label: "Correção", className: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" },
  change: { icon: Wrench, label: "Alteração", className: "bg-slate-100 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400" },
};

function formatarData(data: string | null): string {
  if (!data) return "";
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

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
      <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-16 text-center shadow-none">
        <p className="text-sm text-muted-foreground">
          Nenhuma novidade publicada até o momento.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0 shadow-sm">
      {releases.map((release, index) => {
        const config = TIPO_CONFIG[release.tipo];
        const Icon = config.icon;

        return (
          <div key={release.id}>
            <Link
              href={`${hrefBase}/${release.id}`}
              className="flex items-start justify-between gap-4 px-6 py-5 transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${config.className}`}>
                  <Icon className="size-4" />
                </div>

                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="secondary" className="font-normal">
                      {config.label}
                    </Badge>
                    <Badge variant="outline">v{release.versao}</Badge>
                  </div>

                  <p className="font-semibold leading-snug tracking-tight">{release.titulo}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {textoPreview(release.conteudo)}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatarData(release.publicadoEm)}
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </Link>

            {index < releases.length - 1 && <Separator />}
          </div>
        );
      })}
    </Card>
  );
}
