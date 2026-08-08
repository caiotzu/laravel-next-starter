<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\AuditoriaService;

use App\Http\Requests\Admin\Auditoria\ListarRequest;

use App\DTO\Auditoria\AuditoriaFiltroDTO;

use App\Http\Resources\Admin\Auditoria\AuditoriaResource;

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
}
