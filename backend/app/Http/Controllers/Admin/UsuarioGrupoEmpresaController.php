<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\UsuarioService;

use App\Http\Requests\Admin\UsuarioGrupoEmpresa\AtualizarStatusRequest;

use App\DTO\Usuario\UsuarioAtualizacaoStatusDTO;

use App\Http\Resources\Admin\UsuarioGrupoEmpresa\UsuarioGrupoEmpresaResource;
use App\Http\Resources\Admin\UsuarioGrupoEmpresa\UsuarioGrupoEmpresaRedefinirSenhaResource;

use App\Enums\UsuarioStatus;

class UsuarioGrupoEmpresaController extends Controller
{
    public function __construct(
        protected UsuarioService $usuarioService,
    ) {}

    public function redefinirSenha(string $grupoId, string $usuarioId): JsonResponse
    {
        $this->authorize('admin.grupo_empresa.usuario.redefinir_senha');

        $this->usuarioService->resetarSenha($usuarioId, $grupoId);

        return UsuarioGrupoEmpresaRedefinirSenhaResource::make([
            'mensagem' =>'As instruções de redefinição serão enviadas ao e-mail do cliente, caso o cliente esteja com a situação de ('.UsuarioStatus::ATIVO->value.')'
        ])->response()->setStatusCode(200);
    }

    public function atualizarStatus(AtualizarStatusRequest $request, string $grupoId, string $usuarioId): JsonResponse
    {
        $this->authorize('admin.grupo_empresa.usuario.atualizar_status');

        $usuario = $this->usuarioService->atualizarStatus(
            UsuarioAtualizacaoStatusDTO::criarParaAtualizacaoStatus(
                $grupoId,
                $usuarioId,
                $request->validated()
            )
        );

        return UsuarioGrupoEmpresaResource::make($usuario)->response()->setStatusCode(200);
    }
}
