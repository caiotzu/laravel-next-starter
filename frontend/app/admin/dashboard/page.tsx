"use client";

import { useState } from "react";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";


import { DashboardAtencao } from "@/features/admin/dashboard/components/DashboardAtencao";
import { DashboardDistribuicaoChamados } from "@/features/admin/dashboard/components/DashboardDistribuicaoChamados";
import { DashboardEvolucaoChamadosChart } from "@/features/admin/dashboard/components/DashboardEvolucaoChamadosChart";
import { DashboardEvolucaoEmpresasChart } from "@/features/admin/dashboard/components/DashboardEvolucaoEmpresasChart";
import { DashboardFiltroPeriodo } from "@/features/admin/dashboard/components/DashboardFiltroPeriodo";
import { DashboardKpiCards } from "@/features/admin/dashboard/components/DashboardKpiCards";
import { DashboardRankingResponsaveis } from "@/features/admin/dashboard/components/DashboardRankingResponsaveis";
import { DashboardTempoAtendimentoCard } from "@/features/admin/dashboard/components/DashboardTempoAtendimentoCard";

import { useDashboard } from "@/domains/admin/dashboard/hooks/useDashboard";
import { VisualizarDashboardRequest } from "@/domains/admin/dashboard/types/dashboard.requests";

export default function Page() {
  const [filtro, setFiltro] = useState<VisualizarDashboardRequest>({
    periodo: "ultimos_30_dias",
  });

  // periodo=personalizado só é enviado à API quando as duas datas já
  // foram preenchidas — evita disparar uma requisição inválida (422)
  // enquanto o usuário ainda está escolhendo o intervalo.
  const filtroPronto =
    filtro.periodo !== "personalizado" || (!!filtro.data_inicio && !!filtro.data_fim);

  const { data, isLoading, isError } = useDashboard(filtroPronto ? filtro : { periodo: "ultimos_30_dias" });

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
          <div className="@container/main flex flex-col gap-6 py-6">
            <div className="px-4 lg:px-6">
              <PageHeader
                title="Dashboard"
                description="Visão gerencial da operação: empresas, chamados e desempenho da equipe."
              />
            </div>

            <AdminPermissionGuard permission="admin.dashboard.visualizar">
              <div className="px-4 lg:px-6">
                <DashboardFiltroPeriodo filtro={filtro} onChange={setFiltro} />
              </div>

              {isLoading || !filtroPronto || !data ? (
                <div className="flex flex-col gap-4 px-4 lg:px-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : isError ? (
                <div className="px-4 lg:px-6">
                  <p className="text-sm text-muted-foreground">
                    Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.
                  </p>
                </div>
              ) : (
                <>
                  <DashboardKpiCards kpis={data.kpis} />

                  <div className="grid grid-cols-1 gap-4 px-4 @3xl/main:grid-cols-2 lg:px-6">
                    <DashboardEvolucaoChamadosChart dados={data.evolucao_chamados} />
                    <DashboardEvolucaoEmpresasChart dados={data.evolucao_empresas} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 px-4 @3xl/main:grid-cols-2 lg:px-6">
                    <DashboardRankingResponsaveis ranking={data.ranking_responsaveis} />
                    <div className="flex flex-col gap-4">
                      <DashboardDistribuicaoChamados
                        titulo="Chamados por status"
                        descricao="No período selecionado"
                        dados={data.chamados_por_status}
                        dimensao="status"
                      />
                      <DashboardDistribuicaoChamados
                        titulo="Chamados por prioridade"
                        descricao="No período selecionado"
                        dados={data.chamados_por_prioridade}
                        dimensao="prioridade"
                      />
                    </div>
                  </div>

                  <div className="px-4 lg:px-6">
                    <DashboardTempoAtendimentoCard tempo={data.tempo_atendimento} />
                  </div>

                  <div className="px-4 lg:px-6">
                    <DashboardAtencao
                      semResponsavel={data.chamados_sem_responsavel}
                      maisAntigos={data.chamados_mais_antigos}
                    />
                  </div>
                </>
              )}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
