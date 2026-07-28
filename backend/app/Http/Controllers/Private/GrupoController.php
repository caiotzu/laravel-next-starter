<?php

namespace App\Http\Controllers\Private;


use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\GrupoService;

use App\Http\Requests\Private\Grupo\ListarRequest;
use App\Http\Requests\Private\Grupo\CadastrarRequest;
use App\Http\Requests\Private\Grupo\AtualizarRequest;
use App\Http\Requests\Private\Grupo\SincronizarPermissoesRequest;

use App\DTO\Grupo\GrupoFiltroDTO;
use App\DTO\Grupo\GrupoCadastroDTO;
use App\DTO\Grupo\GrupoAtualizacaoDTO;
use App\DTO\Grupo\SincronizarPermissoesDTO;

use App\Http\Resources\Private\Grupo\GrupoResource;
use App\Http\Resources\Private\Grupo\GrupoVisualizarResource;

use App\Enums\PermissaoTipo;

class GrupoController extends Controller
{
    public function __construct(
        protected GrupoService $grupoService,
    ) {}

    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $this->authorize('private.grupo.cadastrar');

        $grupo = $this->grupoService->cadastrar(GrupoCadastroDTO::criarParaCadastro($request->validated()));

        return GrupoResource::make($grupo)->response()->setStatusCode(201);
    }

    public function atualizar(AtualizarRequest $request, string $id): JsonResponse
    {
        $this->authorize('private.grupo.atualizar');

        $grupo = $this->grupoService->atualizar(
            GrupoAtualizacaoDTO::criarParaAtualizacao(
                $id,
                $request->validated()
            )
        );

        return GrupoResource::make($grupo)->response()->setStatusCode(200);
    }

    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('private.grupo.visualizar');

        $grupo = $this->grupoService->visualizar($id);

        return GrupoVisualizarResource::make($grupo)->response()->setStatusCode(200);
    }

    public function excluir(string $id): JsonResponse
    {
        $this->authorize('private.grupo.excluir');

        $this->grupoService->excluir($id);

        return response()->json(null, 204);
    }

    public function ativar(string $id): JsonResponse
    {
        $this->authorize('private.grupo.ativar');

        $grupo = $this->grupoService->ativar($id);

        return GrupoResource::make($grupo)->response()->setStatusCode(200);
    }

    public function listar(ListarRequest $request): JsonResponse
    {
        $this->authorize('private.grupo.listar');

        $grupos = $this->grupoService->listar(GrupoFiltroDTO::criarParaFiltro($request->validated()));

        return GrupoResource::collection($grupos)->response()->setStatusCode(200);
    }

    public function sincronizarPermissoes(SincronizarPermissoesRequest $request, string $id)
    {
        $this->authorize('private.grupo.sincronizar_permissao');

        $grupo = $this->grupoService->sincronizarPermissoes(SincronizarPermissoesDTO::criarParaSincronizacaoDasPermissoes(
            $id,
            PermissaoTipo::PRIVATE,
            $request->validated()
        ));

        return GrupoVisualizarResource::make($grupo)->response()->setStatusCode(200);
    }
}
