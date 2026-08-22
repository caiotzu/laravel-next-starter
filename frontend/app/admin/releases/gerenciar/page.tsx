"use client";

import { useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { useAtualizarRelease } from "@/domains/admin/release/hooks/useAtualizarRelease";
import { useCadastrarRelease } from "@/domains/admin/release/hooks/useCadastrarRelease";
import { usePublicarRelease } from "@/domains/admin/release/hooks/usePublicarRelease";
import { useReleases } from "@/domains/admin/release/hooks/useReleases";
import { Release } from "@/domains/admin/release/types/release.model";
import {
  ListarReleasesRequest,
} from "@/domains/admin/release/types/release.requests";

import {
  ReleaseFormDialog,
  ReleaseFormValues,
} from "@/features/admin/release/components/ReleaseFormDialog";
import { ReleasesGerenciarTable } from "@/features/admin/release/components/ReleasesGerenciarTable";

export default function Page() {
  const [filtros, setFiltros] = useState<ListarReleasesRequest>({ page: 1 });
  const [dialogAberto, setDialogAberto] = useState(false);
  const [releaseEmEdicao, setReleaseEmEdicao] = useState<Release | null>(null);
  const [publicandoId, setPublicandoId] = useState<string | null>(null);

  const { data, isLoading } = useReleases(filtros);

  const { mutate: cadastrar, isPending: cadastrando } = useCadastrarRelease();
  const { mutate: atualizar, isPending: atualizando } = useAtualizarRelease();
  const { mutate: publicar } = usePublicarRelease();

  function abrirNovaRelease() {
    setReleaseEmEdicao(null);
    setDialogAberto(true);
  }

  function abrirEdicao(release: Release) {
    setReleaseEmEdicao(release);
    setDialogAberto(true);
  }

  function handleSubmit(values: ReleaseFormValues) {
    if (releaseEmEdicao) {
      atualizar(
        { id: releaseEmEdicao.id, payload: values },
        {
          onSuccess: () => {
            toast.success("Release atualizada com sucesso.");
            setDialogAberto(false);
          },
          onError: () => toast.error("Não foi possível atualizar a release."),
        }
      );
      return;
    }

    cadastrar(values, {
      onSuccess: () => {
        toast.success("Release criada como rascunho.");
        setDialogAberto(false);
      },
      onError: () => toast.error("Não foi possível criar a release."),
    });
  }

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
              description="Cadastre, edite e publique as novidades da plataforma para os contextos Admin e Private."
            />

            <AdminPermissionGuard permission="admin.release.listar">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={filtros.contexto ?? "todos"}
                    onValueChange={(value) =>
                      setFiltros((f) => ({
                        ...f,
                        page: 1,
                        contexto: value === "todos" ? undefined : (value as ListarReleasesRequest["contexto"]),
                      }))
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Contexto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os contextos</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filtros.status ?? "todos"}
                    onValueChange={(value) =>
                      setFiltros((f) => ({
                        ...f,
                        page: 1,
                        status: value === "todos" ? undefined : (value as ListarReleasesRequest["status"]),
                      }))
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <AdminPermissionGuard permission="admin.release.cadastrar">
                  <Button onClick={abrirNovaRelease} className="gap-2">
                    <Plus className="size-4" />
                    Nova release
                  </Button>
                </AdminPermissionGuard>
              </div>

              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ReleasesGerenciarTable
                  releases={data?.data ?? []}
                  onEditar={abrirEdicao}
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

      <ReleaseFormDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        release={releaseEmEdicao}
        isLoading={cadastrando || atualizando}
        onSubmit={handleSubmit}
      />
    </SidebarProvider>
  );
}
