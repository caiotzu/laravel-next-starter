<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\EmpresaService;

use App\Http\Requests\Admin\Empresa\ListarRequest;
use App\Http\Requests\Admin\Empresa\CadastrarRequest;
use App\Http\Requests\Admin\Empresa\AtualizarRequest;

use App\DTO\Empresa\EmpresaFiltroDTO;
use App\DTO\Empresa\EmpresaCadastroDTO;
use App\DTO\Empresa\EmpresaAtualizacaoDTO;

class EmpresaController extends Controller
{
    public function __construct(
        protected EmpresaService $empresaService,
    ) {}

    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $this->authorize('admin.empresa.cadastrar');

        $empresa = $this->empresaService->cadastrar(EmpresaCadastroDTO::criarParaCadastro($request->validated()));

        return response()->json($empresa, 201);
    }

    public function atualizar(AtualizarRequest $request, string $id): JsonResponse
    {
        $this->authorize('admin.empresa.atualizar');

        $empresa = $this->empresaService->atualizar(
            $id,
            EmpresaAtualizacaoDTO::criarParaAtualizacao(
                $request->validated()
            )
        );

        return response()->json($empresa, 200);
    }

    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('admin.empresa.visualizar');

        $empresa = $this->empresaService->visualizar($id);

        return response()->json($empresa, 200);
    }

    public function excluir(string $id): JsonResponse
    {
        $this->authorize('admin.empresa.excluir');

        $this->empresaService->excluir($id);

        return response()->json(null, 204);
    }

    public function ativar(string $id): JsonResponse
    {
        $this->authorize('admin.empresa.ativar');

        $empresa = $this->empresaService->ativar($id);

        return response()->json($empresa, 200);
    }

    public function listar(ListarRequest $request): JsonResponse
    {
        $this->authorize('admin.empresa.listar');

        $grupoEmpresas = $this->empresaService->listar(EmpresaFiltroDTO::criarParaFiltro($request->validated()));

        return response()->json($grupoEmpresas, 200);
    }
}
