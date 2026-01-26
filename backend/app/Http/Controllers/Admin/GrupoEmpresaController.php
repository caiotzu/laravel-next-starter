<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\GrupoEmpresaService;

use App\Http\Requests\Admin\GrupoEmpresa\ListarRequest;
use App\Http\Requests\Admin\GrupoEmpresa\CadastrarRequest;

use App\DTO\GrupoEmpresaDTO;

class GrupoEmpresaController extends Controller
{
    public function __construct(
        protected GrupoEmpresaService $grupoEmpresaService,
    ) {}

    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $grupoEmpresa = $this->grupoEmpresaService->cadastrar(GrupoEmpresaDTO::criarParaCadastro($request->validated()));

        return response()->json($grupoEmpresa, 201);
    }

    public function listar(ListarRequest $request): JsonResponse
    {
        $grupoEmpresas = $this->grupoEmpresaService->listar(GrupoEmpresaDTO::criarParaFiltro($request->validated()));

        return response()->json($grupoEmpresas, 200);
    }
}
