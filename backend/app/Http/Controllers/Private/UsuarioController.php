<?php

namespace App\Http\Controllers\Private;


use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\UsuarioService;

use App\Http\Requests\Private\Usuario\ListarRequest;
use App\Http\Requests\Private\Usuario\CadastrarRequest;
use App\Http\Requests\Private\Usuario\AtualizarRequest;

use App\DTO\Usuario\UsuarioFiltroDTO;
use App\DTO\Usuario\UsuarioCadastroDTO;
use App\DTO\Usuario\UsuarioAtualizacaoDTO;

use App\Http\Resources\Private\Usuario\UsuarioResource;
use App\Http\Resources\Private\Usuario\UsuarioListarResource;
use App\Http\Resources\Private\Usuario\UsuarioVisualizarResource;

class UsuarioController extends Controller
{
    public function __construct(
        protected UsuarioService $usuarioService,
    ) {}

    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $this->authorize('private.usuario.cadastrar');

        $grupo = $this->usuarioService->cadastrar(UsuarioCadastroDTO::criarParaCadastro($request->validated()));

        return UsuarioResource::make($grupo)->response()->setStatusCode(201);
    }

    public function atualizar(AtualizarRequest $request, string $id): JsonResponse
    {
        $this->authorize('private.usuario.atualizar');

        $grupo = $this->usuarioService->atualizar(
            UsuarioAtualizacaoDTO::criarParaAtualizacao(
                $id,
                $request->validated()
            )
        );

        return UsuarioResource::make($grupo)->response()->setStatusCode(200);
    }

    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('private.usuario.visualizar');

        $grupo = $this->usuarioService->visualizar($id);

        return UsuarioVisualizarResource::make($grupo)->response()->setStatusCode(200);
    }

    public function excluir(string $id): JsonResponse
    {
        $this->authorize('private.usuario.excluir');

        $this->usuarioService->excluir($id);

        return response()->json(null, 204);
    }

    public function ativar(string $id): JsonResponse
    {
        $this->authorize('private.usuario.ativar');

        $grupo = $this->usuarioService->ativar($id);

        return UsuarioResource::make($grupo)->response()->setStatusCode(200);
    }

    public function listar(ListarRequest $request): JsonResponse
    {
        $this->authorize('private.usuario.listar');

        $grupos = $this->usuarioService->listar(UsuarioFiltroDTO::criarParaFiltro($request->validated()));

        return UsuarioListarResource::collection($grupos)->response()->setStatusCode(200);
    }
}
