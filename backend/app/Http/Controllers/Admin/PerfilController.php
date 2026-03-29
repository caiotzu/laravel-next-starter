<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

use App\Services\PerfilService;
use App\Services\UsuarioSessaoService;

use App\DTO\Perfil\PerfilAtualizacaoDTO;
use App\DTO\Perfil\PerfilAtualizacaoSenhaDTO;
use App\DTO\Perfil\PerfilAvatarBase64AtualizacaoDTO;

use App\Http\Requests\Admin\Perfil\AtualizarRequest;
use App\Http\Requests\Admin\Perfil\AtualizarAvatarBase64Request;
use App\Http\Requests\Admin\Perfil\AtualizarSenhaRequest;

class PerfilController extends Controller
{
    public function __construct(
        protected PerfilService $perfilService,
        protected UsuarioSessaoService $usuarioSessaoService
    ) {}

    public function atualizar(AtualizarRequest $request): JsonResponse
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();

        $usuarioAtualizado = $this->perfilService->atualizar(
            PerfilAtualizacaoDTO::criarParaAtualizacao(
                $usuario,
                $request->validated()
            )
        );

        return response()->json($usuarioAtualizado);
    }

    public function atualizarSenha(AtualizarSenhaRequest $request): JsonResponse
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();

        $usuarioAtualizado = $this->perfilService->atualizarSenha(
            PerfilAtualizacaoSenhaDTO::criarParaAtualizacaoSenha(
                $usuario,
                $request->validated()
            )
        );

        return response()->json($usuarioAtualizado);
    }

    public function atualizarAvatarBase64(AtualizarAvatarBase64Request $request): JsonResponse
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();

        $usuarioAtualizado = $this->perfilService->atualizarAvatarBase64(
            PerfilAvatarBase64AtualizacaoDTO::criarParaAtualizacao(
                $usuario,
                $request->avatar
            )
        );

        return response()->json($usuarioAtualizado);
    }

    public function sessoes(): JsonResponse
    {
        /** @var \App\Models\Usuario $usuario */
        $user = Auth::user();

        $sessoes = $this->usuarioSessaoService->listarSessoesAtivas($user);

        return response()->json($sessoes);
    }

    public function encerrarSessao(string $id): JsonResponse
    {
        /** @var \App\Models\Usuario $usuario */
        $user = Auth::user();

        $this->usuarioSessaoService->encerrarSessao($user, $id);

        return response()->json(null, 204);
    }
}
