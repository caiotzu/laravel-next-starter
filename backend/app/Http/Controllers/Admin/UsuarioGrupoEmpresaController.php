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

use OpenApi\Attributes as OA;

class UsuarioGrupoEmpresaController extends Controller
{
    public function __construct(
        protected UsuarioService $usuarioService,
    ) {}

    #[OA\Patch(
        path: '/admin/grupos-empresas/{grupoId}/usuarios/{usuarioId}/redefinir-senha',
        summary: 'Admin — Solicitar redefinição de senha de usuário do grupo empresa',
        description: 'Dispara o fluxo de redefinição de senha para um usuário (Private) vinculado ao grupo empresa. As instruções só são efetivamente enviadas se o usuário estiver com status "ativo".',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'grupoId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'usuarioId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Solicitação processada.',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'data', properties: [
                        new OA\Property(property: 'mensagem', type: 'string'),
                    ], type: 'object'),
                ], type: 'object')
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function redefinirSenha(string $grupoId, string $usuarioId): JsonResponse
    {
        $this->authorize('admin.grupo_empresa.usuario.redefinir_senha');

        $this->usuarioService->resetarSenha($usuarioId, $grupoId);

        return UsuarioGrupoEmpresaRedefinirSenhaResource::make([
            'mensagem' =>'As instruções de redefinição serão enviadas ao e-mail do cliente, caso o cliente esteja com a situação de ('.UsuarioStatus::ATIVO->value.')'
        ])->response()->setStatusCode(200);
    }

    #[OA\Patch(
        path: '/admin/grupos-empresas/{grupoId}/usuarios/{usuarioId}/status',
        summary: 'Admin — Atualizar status de usuário do grupo empresa',
        description: 'Atualiza o status (ativo/inativo/bloqueado) de um usuário (Private) vinculado ao grupo empresa.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'grupoId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'usuarioId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['status'],
            properties: [new OA\Property(property: 'status', type: 'string', enum: ['ativo', 'inativo', 'bloqueado'])],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Status atualizado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Usuario', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
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
