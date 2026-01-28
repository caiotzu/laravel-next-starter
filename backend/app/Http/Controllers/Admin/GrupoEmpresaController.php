<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\GrupoEmpresaService;

use App\Http\Requests\Admin\GrupoEmpresa\ListarRequest;
use App\Http\Requests\Admin\GrupoEmpresa\CadastrarRequest;
use App\Http\Requests\Admin\GrupoEmpresa\AtualizarRequest;

use App\DTO\GrupoEmpresa\GrupoEmpresaFiltroDTO;
use App\DTO\GrupoEmpresa\GrupoEmpresaCadastroDTO;
use App\DTO\GrupoEmpresa\GrupoEmpresaAtualizacaoDTO;


class GrupoEmpresaController extends Controller
{
    public function __construct(
        protected GrupoEmpresaService $grupoEmpresaService,
    ) {}

    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $grupoEmpresa = $this->grupoEmpresaService->cadastrar(GrupoEmpresaCadastroDTO::criarParaCadastro($request->validated()));

        return response()->json($grupoEmpresa, 201);
    }

    public function atualizar(AtualizarRequest $request, string $id): JsonResponse
    {
        $grupo = $this->grupoEmpresaService->atualizar(
            GrupoEmpresaAtualizacaoDTO::criarParaAtualizacao(
                $id,
                $request->validated()
            )
        );

        return response()->json($grupo);
    }

    public function excluir(string $id): JsonResponse
    {
        $this->grupoEmpresaService->excluir($id);

        return response()->json(null, 204);
    }

    public function ativar(string $id): JsonResponse
    {
        $grupo = $this->grupoEmpresaService->ativar($id);

        return response()->json($grupo, 200);
    }

    public function listar(ListarRequest $request): JsonResponse
    {
        $grupoEmpresas = $this->grupoEmpresaService->listar(GrupoEmpresaFiltroDTO::criarParaFiltro($request->validated()));

        return response()->json($grupoEmpresas, 200);
    }
}
