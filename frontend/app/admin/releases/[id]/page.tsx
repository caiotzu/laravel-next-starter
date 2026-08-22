"use client";

import { use } from "react";

import { ArrowLeft, Bug, RefreshCw, Sparkles, Wrench } from "lucide-react";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { RichTextViewer } from "@/components/editor/RichTextViewer";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { useRelease } from "@/domains/admin/release/hooks/useRelease";
import { ReleaseTipo } from "@/domains/admin/release/types/release.model";

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
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-6 px-4 lg:px-6">
            <PageHeader
              title="Release"
              description="Detalhes da release."
              actions={[
                {
                  label: "Voltar",
                  href: "/admin/releases",
                  variant: "default",
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.release.listar">
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : !release ? (
                <p className="text-sm text-muted-foreground">Release não encontrada.</p>
              ) : (
                <Card className="shadow-sm">
                  <CardContent className="px-8 py-8">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {(() => {
                        const config = TIPO_CONFIG[release.tipo];
                        const Icon = config.icon;
                        return (
                          <Badge className={`gap-1.5 font-normal ${config.className}`}>
                            <Icon className="size-3.5" />
                            {config.label}
                          </Badge>
                        );
                      })()}
                      <Badge variant="outline">v{release.versao}</Badge>
                      <Badge variant={release.status === "published" ? "default" : "secondary"}>
                        {release.status === "published" ? "Publicada" : "Rascunho"}
                      </Badge>
                      <span className="text-sm text-muted-foreground capitalize">
                        {release.contexto ?? "—"}
                      </span>
                      {release.publicadoEm && (
                        <span className="text-sm text-muted-foreground">
                          • {formatarData(release.publicadoEm)}
                        </span>
                      )}
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-balance">
                      {release.titulo}
                    </h1>

                    <Separator className="my-6" />

                    <RichTextViewer html={release.conteudo} />
                  </CardContent>
                </Card>
              )}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
