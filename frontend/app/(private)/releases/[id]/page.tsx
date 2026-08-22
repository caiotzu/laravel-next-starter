"use client";

import { use } from "react";

import { ArrowLeft, Bug, RefreshCw, Sparkles, Wrench } from "lucide-react";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";
import { AppSidebar } from "@/app/(private)/_components/layouts/app-sidebar";
import { PageHeader } from "@/app/(private)/_components/layouts/page-header";
import { SiteHeader } from "@/app/(private)/_components/layouts/site-header";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { useRelease } from "@/domains/private/release/hooks/useRelease";
import { ReleaseTipo } from "@/domains/private/release/types/release.model";

const TIPO_CONFIG: Record<ReleaseTipo, { icon: typeof Sparkles; className: string }> = {
  feature: { icon: Sparkles, className: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" },
  improvement: { icon: RefreshCw, className: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" },
  fix: { icon: Bug, className: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" },
  change: { icon: Wrench, className: "bg-slate-100 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400" },
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: release, isLoading } = useRelease(id);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
            <PageHeader
              title="Release"
              description="Detalhes da novidade publicada."
              actions={[
                {
                  label: "Voltar",
                  href: "/releases",
                  icon: <ArrowLeft className="size-4" />,
                  variant: "outline",
                },
              ]}
            />

            <PrivatePermissionGuard permission="private.release.listar">
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : !release ? (
                <p className="text-sm text-muted-foreground">Release não encontrada.</p>
              ) : (
                <Card>
                  <CardContent className="space-y-4 px-6">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const config = TIPO_CONFIG[release.tipo];
                        const Icon = config.icon;
                        return (
                          <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${config.className}`}>
                            <Icon className="size-4" />
                          </div>
                        );
                      })()}

                      <div>
                        <h2 className="text-lg font-semibold leading-tight">{release.titulo}</h2>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline">v{release.versao}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {release.tipoLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {release.conteudo}
                    </p>
                  </CardContent>
                </Card>
              )}
            </PrivatePermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
