<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\AuditoriaService;
use App\Enums\AuditoriaEntidade;

use App\Http\Requests\Admin\Auditoria\ListarRequest;
use App\Http\Requests\Admin\Auditoria\ListarEntidadeRequest;

use App\DTO\Auditoria\AuditoriaFiltroDTO;
use App\DTO\Auditoria\AuditoriaEntidadeFiltroDTO;

use App\Http\Resources\Admin\Auditoria\AuditoriaResource;
use App\Http\Resources\Admin\Auditoria\AuditoriaEntidadeResource;

class AuditoriaController extends Controller
{
    public function __construct(
        protected AuditoriaService $auditoriaService,
    ) {}

    public function listar(ListarRequest $request): JsonResponse
    {
        $this->authorize('admin.auditoria.listar');

        $auditorias = $this->auditoriaService->listar(
            AuditoriaFiltroDTO::criarParaFiltro($request->validated())
        );

        return AuditoriaResource::collection($auditorias)->response()->setStatusCode(200);
    }

    public function listarEntidadesAuditaveis(): JsonResponse
    {
        $this->authorize('admin.auditoria.listar');

        return response()->json([
            'data' => $this->auditoriaService->listarEntidadesAuditaveis(),
        ]);
    }

    public function listarUsuarios(ListarEntidadeRequest $request): JsonResponse
    {
        $this->authorize('admin.auditoria.listar');

        $usuarios = $this->auditoriaService->listarRegistrosEntidade(
            AuditoriaEntidade::USUARIOS,
            AuditoriaEntidadeFiltroDTO::criarParaFiltro($request->validated()),
        );

        return AuditoriaEntidadeResource::collection($usuarios)->response()->setStatusCode(200);
    }

    public function listarRegistrosEntidade(
        ListarEntidadeRequest $request,
        string $entidade,
    ): JsonResponse {
        $this->authorize('admin.auditoria.listar');

        $entidadeAuditavel = AuditoriaEntidade::tryFrom($entidade);

        abort_unless($entidadeAuditavel, 404);

        $registros = $this->auditoriaService->listarRegistrosEntidade(
            $entidadeAuditavel,
            AuditoriaEntidadeFiltroDTO::criarParaFiltro($request->validated()),
        );

        return AuditoriaEntidadeResource::collection($registros)->response()->setStatusCode(200);
    }
}
