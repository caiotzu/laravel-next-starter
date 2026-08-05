<?php

namespace App\Http\Controllers\Private;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\EmpresaService;

use App\Http\Requests\Private\Empresa\ListarRequest;
use App\Http\Requests\Private\Empresa\AtualizarRequest;

use App\DTO\Empresa\EmpresaFiltroDTO;
use App\DTO\Empresa\EmpresaAtualizacaoDTO;

use App\Http\Resources\Private\Empresa\EmpresaResource;
use App\Http\Resources\Private\Empresa\EmpresaListarResource;
use App\Http\Resources\Private\Empresa\EmpresaVisualizarResource;

use App\Enums\EntidadeTipo;

class EmpresaController extends Controller
{
    public function __construct(
        protected EmpresaService $empresaService,
    ) {}

    public function atualizar(AtualizarRequest $request, string $id): JsonResponse
    {
        $this->authorize('private.empresa.atualizar');

        $empresa = $this->empresaService->atualizar(
            EmpresaAtualizacaoDTO::criarParaAtualizacao(
                $id,
                $request->validated()
            ),
            EntidadeTipo::PRIVATE
        );

        return EmpresaResource::make($empresa)->response()->setStatusCode(200);
    }

    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('private.empresa.visualizar');

        $empresa = $this->empresaService->visualizar($id, EntidadeTipo::PRIVATE);

        return EmpresaVisualizarResource::make($empresa)->response()->setStatusCode(200);
    }

    public function listar(ListarRequest $request): JsonResponse
    {
        $this->authorize('private.empresa.listar');

        $empresas = $this->empresaService->listar(
            EmpresaFiltroDTO::criarParaFiltro($request->validated()),
            EntidadeTipo::PRIVATE
        );

        return EmpresaListarResource::collection($empresas)->response()->setStatusCode(200);
    }
}
