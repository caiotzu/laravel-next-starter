"use client";

import { useState } from "react";

import { toast } from "sonner";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { usePublicarRelease } from "@/domains/admin/release/hooks/usePublicarRelease";
import { useReleases } from "@/domains/admin/release/hooks/useReleases";
import { Release } from "@/domains/admin/release/types/release.model";
import { ListarReleasesRequest } from "@/domains/admin/release/types/release.requests";

import { ReleasesGerenciarFilters } from "@/features/admin/release/components/ReleasesGerenciarFilters";
import { ReleasesGerenciarTable } from "@/features/admin/release/components/ReleasesGerenciarTable";

export default function Page() {
  const [filtros, setFiltros] = useState<ListarReleasesRequest>({ page: 1 });
  const [publicandoId, setPublicandoId] = useState<string | null>(null);

  const { data, isLoading } = useReleases(filtros);
  const { mutate: publicar } = usePublicarRelease();

  function handlePublicar(release: Release) {
    setPublicandoId(release.id);
    publicar(release.id, {
      onSuccess: () => toast.success("Release publicada."),
      onError: () => toast.error("Não foi possível publicar a release."),
      onSettled: () => setPublicandoId(null),
    });
  }

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
              title="Gerenciar Releases"
              description="Cadastre, edite e publique as novidades da plataforma."
              actions={[
                {
                  label: "Cadastrar",
                  href: "/admin/releases/gerenciar/cadastrar",
                  icon: null,
                  permission: "admin.release.cadastrar",
                  variant: "default",
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.release.listar">
              <ReleasesGerenciarFilters filtros={filtros} setFiltros={setFiltros} />

              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ReleasesGerenciarTable
                  releases={data?.data ?? []}
                  onPublicar={handlePublicar}
                  publicandoId={publicandoId}
                />
              )}

              {data && (
                <Pagination
                  currentPage={data.meta.current_page}
                  lastPage={data.meta.last_page}
                  total={data.meta.total}
                  from={data.meta.from ?? 0}
                  to={data.meta.to ?? 0}
                  onPageChange={(page) => setFiltros((f) => ({ ...f, page }))}
                />
              )}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
