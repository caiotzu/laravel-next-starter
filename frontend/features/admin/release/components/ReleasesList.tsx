"use client";

import Link from "next/link";

import { Sparkles, Wrench, Bug, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { Release, ReleaseTipo } from "@/domains/admin/release/types/release.model";

const TIPO_CONFIG: Record<ReleaseTipo, { icon: typeof Sparkles; className: string }> = {
  feature: { icon: Sparkles, className: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" },
  improvement: { icon: RefreshCw, className: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" },
  fix: { icon: Bug, className: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" },
  change: { icon: Wrench, className: "bg-slate-100 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400" },
};

function formatarData(data: string | null): string {
  if (!data) return "";
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface Props {
  releases: Release[];
  hrefBase: string;
}

export function ReleasesList({ releases, hrefBase }: Props) {
  if (releases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma novidade publicada até o momento.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {releases.map((release) => {
        const config = TIPO_CONFIG[release.tipo];
        const Icon = config.icon;

        return (
          <Link key={release.id} href={`${hrefBase}/${release.id}`}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardContent className="flex items-start justify-between gap-4 px-5">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${config.className}`}>
                    <Icon className="size-4" />
                  </div>

                  <div>
                    <p className="font-medium leading-snug">{release.titulo}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {release.conteudo}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge variant="outline">v{release.versao}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatarData(release.publicadoEm)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
