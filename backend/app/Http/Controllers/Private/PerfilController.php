<?php

namespace App\Http\Controllers\Private;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

use App\Services\PerfilService;
use App\Services\UsuarioSessaoService;

use App\DTO\Perfil\PerfilAtualizacaoDTO;
use App\DTO\Perfil\PerfilAtualizacaoSenhaDTO;
use App\DTO\Perfil\PerfilAvatarBase64AtualizacaoDTO;

use App\Http\Requests\Private\Perfil\AtualizarRequest;
use App\Http\Requests\Private\Perfil\AtualizarSenhaRequest;
use App\Http\Requests\Private\Perfil\AtualizarAvatarBase64Request;

use App\Http\Resources\Private\Usuario\UsuarioResource;
use App\Http\Resources\Private\UsuarioSessao\UsuarioSessaoResource;

use OpenApi\Attributes as OA;

class PerfilController extends Controller
{
    public function __construct(
        protected PerfilService $perfilService,
        protected UsuarioSessaoService $usuarioSessaoService
    ) {}

    #[OA\Patch(
        path: '/perfil',
        summary: 'Private — Atualizar dados do perfil',
        description: 'Atualiza nome e/ou e-mail do usuário autenticado. Ambos os campos são opcionais (envie apenas o que deseja alterar).',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'nome', type: 'string', maxLength: 255),
                new OA\Property(property: 'email', type: 'string', format: 'email', maxLength: 255, description: 'Deve ser único entre os usuários.'),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Perfil atualizado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Usuario', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
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

        return UsuarioResource::make($usuarioAtualizado)->response()->setStatusCode(200);
    }

    #[OA\Patch(
        path: '/perfil/senha',
        summary: 'Private — Atualizar senha do perfil',
        description: 'Atualiza a senha do usuário autenticado. Exige a senha atual (validada no servidor) e a nova senha, com política mínima de complexidade.',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['senha_atual', 'senha_nova', 'senha_nova_confirma'],
            properties: [
                new OA\Property(property: 'senha_atual', type: 'string', format: 'password'),
                new OA\Property(property: 'senha_nova', type: 'string', format: 'password', description: 'Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo. Deve ser diferente da senha atual.', example: 'NovaSenhaForte@123'),
                new OA\Property(property: 'senha_nova_confirma', type: 'string', format: 'password', example: 'NovaSenhaForte@123'),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Senha atualizada.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Usuario', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
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

        return UsuarioResource::make($usuarioAtualizado)->response()->setStatusCode(200);
    }

    #[OA\Patch(
        path: '/perfil/avatar',
        summary: 'Private — Atualizar avatar do perfil',
        description: 'Atualiza o avatar do usuário autenticado a partir de uma imagem codificada em Base64 (apenas PNG ou JPG).',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['avatar'],
            properties: [new OA\Property(property: 'avatar', type: 'string', description: 'Conteúdo da imagem (PNG ou JPG) codificado em Base64.')],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Avatar atualizado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Usuario', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
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

        return UsuarioResource::make($usuarioAtualizado)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/perfil/sessoes',
        summary: 'Private — Listar sessões ativas do perfil',
        description: 'Lista as sessões ativas (dispositivos/navegadores logados) do usuário autenticado.',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        responses: [
            new OA\Response(response: 200, description: 'Lista de sessões ativas.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/UsuarioSessao')),
            ], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
        ]
    )]
    public function sessoes(): JsonResponse
    {
        /** @var \App\Models\Usuario $usuario */
        $user = Auth::user();

        $sessoes = $this->usuarioSessaoService->listarSessoesAtivas($user);

        return UsuarioSessaoResource::collection($sessoes)->response()->setStatusCode(200);
    }

    #[OA\Delete(
        path: '/perfil/sessoes/{id}/encerrar',
        summary: 'Private — Encerrar sessão do perfil',
        description: 'Encerra uma sessão ativa específica do usuário autenticado (ex.: deslogar remotamente de outro dispositivo).',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 204, ref: '#/components/responses/NoContent'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function encerrarSessao(string $id): JsonResponse
    {
        /** @var \App\Models\Usuario $usuario */
        $user = Auth::user();

        $this->usuarioSessaoService->encerrarSessao($user, $id);

        return response()->json(null, 204);
    }
}
