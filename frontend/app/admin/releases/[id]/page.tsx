"use client";

import { use } from "react";

import { ArrowLeft, CalendarDays, Layers3 } from "lucide-react";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { RichTextViewer } from "@/components/editor/RichTextViewer";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import {
  getReleaseTipoBadge,
  getReleaseTipoIcon,
  getReleaseTipoLabel,
} from "@/constants/release-tipo";
import { useRelease } from "@/domains/admin/release/hooks/useRelease";
import { formatDate } from "@/lib/utils";

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-6">
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
                <Card>
                  <CardContent className="p-8">
                    <Skeleton className="h-96 w-full" />
                  </CardContent>
                </Card>
              ) : !release ? (
                <Card>
                  <CardContent className="flex min-h-40 items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Release não encontrada.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden shadow-sm p-2">
                  {/* Header da release */}
                  <div className="border-b">
                    <div className="px-6 py-8 lg:px-10 lg:py-10">
                      <div className="mx-auto">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {(() => {
                            const Icon = getReleaseTipoIcon(release.tipo);

                            return (
                              <Badge
                                className={`gap-1.5 px-2.5 py-1 font-medium ${getReleaseTipoBadge(
                                  release.tipo
                                )}`}
                              >
                                <Icon className="size-3.5" />
                                {getReleaseTipoLabel(release.tipo)}
                              </Badge>
                            );
                          })()}

                          <Badge
                            variant="outline"
                            className="px-2.5 py-1 font-mono text-xs"
                          >
                            v{release.versao}
                          </Badge>

                          <Badge
                            variant={
                              release.status === "published"
                                ? "default"
                                : "secondary"
                            }
                            className="px-2.5 py-1"
                          >
                            {release.status === "published"
                              ? "Publicada"
                              : "Rascunho"}
                          </Badge>
                        </div>

                        {/* Título */}
                        <h1 className="mt-5 max-w-4xl text-3xl font-bold tracking-tight text-balance lg:text-4xl">
                          {release.titulo}
                        </h1>

                        {/* Metadados */}
                        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
                          {release.contexto && (
                            <div className="flex items-center gap-2">
                              <Layers3 className="size-4" />
                              <span className="capitalize">
                                {release.contexto}
                              </span>
                            </div>
                          )}

                          {release.publicadoEm && (
                            <div className="flex items-center gap-2">
                              <CalendarDays className="size-4" />
                              <span>
                                Publicada em{" "}
                                {formatDate(release.publicadoEm, false)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <CardContent className="px-6 py-10 lg:px-10 lg:py-12">
                    <article className="mx-auto">
                      <RichTextViewer html={release.conteudo} />
                    </article>
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