<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\DashboardService;

use App\Http\Requests\Admin\Dashboard\VisualizarRequest;

use App\DTO\Dashboard\DashboardFiltroDTO;

use App\Http\Resources\Admin\Dashboard\DashboardResource;

use OpenApi\Attributes as OA;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService,
    ) {}

    #[OA\Get(
        path: '/admin/dashboard',
        summary: 'Admin — Visão gerencial (KPIs, evolução, ranking, pontos de atenção)',
        description: 'Todas as agregações são calculadas no banco de dados. periodo=personalizado exige data_inicio e data_fim.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'periodo', in: 'query', schema: new OA\Schema(type: 'string', enum: ['hoje', 'ultimos_7_dias', 'ultimos_30_dias', 'ultimos_90_dias', 'este_ano', 'personalizado'], default: 'ultimos_30_dias')),
            new OA\Parameter(name: 'data_inicio', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'data_fim', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Dados agregados do dashboard.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Dashboard', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function visualizar(VisualizarRequest $request): JsonResponse
    {
        $this->authorize('admin.dashboard.visualizar');

        $filtro = DashboardFiltroDTO::criarParaFiltro($request->validated());

        return DashboardResource::make([
            'periodo' => [
                'inicio' => $filtro->inicio->toDateString(),
                'fim' => $filtro->fim->toDateString(),
                'inicio_anterior' => $filtro->inicioAnterior->toDateString(),
                'fim_anterior' => $filtro->fimAnterior->toDateString(),
            ],
            'kpis' => $this->dashboardService->kpis($filtro),
            'evolucao_chamados' => $this->dashboardService->evolucaoChamados($filtro),
            'evolucao_empresas' => $this->dashboardService->evolucaoEmpresas($filtro),
            'empresas_por_status' => $this->dashboardService->empresasPorStatus(),
            'chamados_por_status' => $this->dashboardService->chamadosPorStatus($filtro),
            'chamados_por_prioridade' => $this->dashboardService->chamadosPorPrioridade($filtro),
            'chamados_por_tipo' => $this->dashboardService->chamadosPorTipo($filtro),
            'ranking_responsaveis' => $this->dashboardService->rankingResponsaveis($filtro),
            'chamados_sem_responsavel' => $this->dashboardService->chamadosSemResponsavel(),
            'chamados_mais_antigos' => $this->dashboardService->chamadosMaisAntigos(),
            'tempo_atendimento' => $this->dashboardService->tempoAtendimento($filtro),
        ])->response()->setStatusCode(200);
    }
}
