<?php

namespace App\Http\Controllers\Admin;


use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\UsuarioService;

use App\Http\Requests\Admin\Usuario\ListarRequest;
use App\Http\Requests\Admin\Usuario\CadastrarRequest;
use App\Http\Requests\Admin\Usuario\AtualizarRequest;

use App\DTO\Usuario\UsuarioFiltroDTO;
use App\DTO\Usuario\UsuarioCadastroDTO;
use App\DTO\Usuario\UsuarioAtualizacaoDTO;

use App\Http\Resources\Admin\Usuario\UsuarioResource;
use App\Http\Resources\Admin\Usuario\UsuarioListarResource;
use App\Http\Resources\Admin\Usuario\UsuarioVisualizarResource;

class UsuarioController extends Controller
{
    public function __construct(
        protected UsuarioService $usuarioService,
    ) {}

    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $this->authorize('admin.usuario.cadastrar');

        $grupo = $this->usuarioService->cadastrar(UsuarioCadastroDTO::criarParaCadastro($request->validated()));

        return UsuarioResource::make($grupo)->response()->setStatusCode(201);
    }

    public function atualizar(AtualizarRequest $request, string $id): JsonResponse
    {
        $this->authorize('admin.usuario.atualizar');

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
        $this->authorize('admin.usuario.visualizar');

        $grupo = $this->usuarioService->visualizar($id);

        return UsuarioVisualizarResource::make($grupo)->response()->setStatusCode(200);
    }

    public function excluir(string $id): JsonResponse
    {
        $this->authorize('admin.usuario.excluir');

        $this->usuarioService->excluir($id);

        return response()->json(null, 204);
    }

    public function ativar(string $id): JsonResponse
    {
        $this->authorize('admin.usuario.ativar');

        $grupo = $this->usuarioService->ativar($id);

        return UsuarioResource::make($grupo)->response()->setStatusCode(200);
    }

    public function listar(ListarRequest $request): JsonResponse
    {
        $this->authorize('admin.usuario.listar');

        $grupos = $this->usuarioService->listar(UsuarioFiltroDTO::criarParaFiltro($request->validated()));

        return UsuarioListarResource::collection($grupos)->response()->setStatusCode(200);
    }
}
