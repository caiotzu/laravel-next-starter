<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

use App\Services\UsuarioService;
use App\Services\UsuarioSessaoService;

use App\DTO\Usuario\UsuarioAtualizacaoDTO;
use App\DTO\Usuario\UsuarioAvatarBase64AtualizacaoDTO;

use App\Http\Requests\Admin\usuario\AtualizarRequest;
use App\Http\Requests\Admin\Usuario\AtualizarAvatarBase64Request;

class PerfilController extends Controller
{
    public function __construct(
        protected UsuarioService $usuarioService,
        protected UsuarioSessaoService $usuarioSessaoService
    ) {}

    public function atualizar(AtualizarRequest $request)
    {
        /** @var \App\Models\Usuario $usuario */
        $usuario = Auth::user();

        $usuarioAtualizado = $this->usuarioService->atualizar(
            UsuarioAtualizacaoDTO::criarParaAtualizacao(
                $usuario->id,
                $request->validated()
            )
        );

        return response()->json([
            'message' => 'Dados do usuário autenticado atualizado com sucesso.',
            'data' => $usuarioAtualizado,
        ]);
    }

    public function atualizarAvatarBase64(AtualizarAvatarBase64Request $request)
    {
        $usuario = Auth::user();

        $usuarioAtualizado = $this->usuarioService->atualizarAvatarBase64(
            UsuarioAvatarBase64AtualizacaoDTO::criarParaAtualizacao(
                $usuario->id,
                $request->avatar
            )
        );

        // Ajusta a URL de retorno
        $usuarioAtualizado->avatar = $usuarioAtualizado->avatar ? url(Storage::url($usuarioAtualizado->avatar)) : null;

        return response()->json([
            'message' => 'Avatar atualizado com sucesso.',
            'data' => $usuarioAtualizado,
        ]);
    }

    public function sessoes(): JsonResponse
    {
        $user = Auth::user();
        $sessoes = $this->usuarioSessaoService->listarSessoesAtivas($user);

        return response()->json($sessoes);
    }

    public function encerrarSessao(string $id): JsonResponse
    {
        $user = Auth::user();

        try {
            $this->usuarioSessaoService->encerrarSessao($user, $id);
            return response()->json(['message' => 'Sessão encerrada']);
        } catch (\Exception $e) {
            return response()->json([
                'errors' => ['business' => ['Não foi possível encerrar a sessão ('.$id.')']]
            ], 500);
        }
    }
}
