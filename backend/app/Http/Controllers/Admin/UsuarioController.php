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

use OpenApi\Attributes as OA;

class UsuarioController extends Controller
{
    public function __construct(
        protected UsuarioService $usuarioService,
    ) {}

    #[OA\Post(
        path: '/admin/usuarios',
        summary: 'Admin — Cadastrar usuário',
        description: 'Cria o usuário com status "convidado" e dispara e-mail de primeiro acesso (a senha é definida pelo próprio usuário via token).',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['grupo_id', 'nome', 'email'],
            properties: [
                new OA\Property(property: 'grupo_id', type: 'string', format: 'uuid'),
                new OA\Property(property: 'nome', type: 'string', maxLength: 255),
                new OA\Property(property: 'email', type: 'string', format: 'email', maxLength: 255, description: 'Deve ser único entre os usuários.'),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 201, description: 'Usuário cadastrado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Usuario', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $this->authorize('admin.usuario.cadastrar');

        $grupo = $this->usuarioService->cadastrar(UsuarioCadastroDTO::criarParaCadastro($request->validated()));

        return UsuarioResource::make($grupo)->response()->setStatusCode(201);
    }

    #[OA\Put(
        path: '/admin/usuarios/{id}',
        summary: 'Admin — Atualizar usuário',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['grupo_id', 'nome', 'email'],
            properties: [
                new OA\Property(property: 'grupo_id', type: 'string', format: 'uuid'),
                new OA\Property(property: 'nome', type: 'string', maxLength: 255),
                new OA\Property(property: 'email', type: 'string', format: 'email', maxLength: 255),
                new OA\Property(property: 'status', type: 'string', enum: ['ativo', 'inativo', 'bloqueado'], nullable: true),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Usuário atualizado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Usuario', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
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

    #[OA\Get(
        path: '/admin/usuarios/{id}',
        summary: 'Admin — Visualizar usuário',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Usuário encontrado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/UsuarioVisualizar', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('admin.usuario.visualizar');

        $grupo = $this->usuarioService->visualizar($id);

        return UsuarioVisualizarResource::make($grupo)->response()->setStatusCode(200);
    }

    #[OA\Delete(
        path: '/admin/usuarios/{id}',
        summary: 'Admin — Excluir usuário',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 204, ref: '#/components/responses/NoContent'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function excluir(string $id): JsonResponse
    {
        $this->authorize('admin.usuario.excluir');

        $this->usuarioService->excluir($id);

        return response()->json(null, 204);
    }

    #[OA\Patch(
        path: '/admin/usuarios/{id}/ativar',
        summary: 'Admin — Ativar/reativar usuário',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Usuário ativado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Usuario', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function ativar(string $id): JsonResponse
    {
        $this->authorize('admin.usuario.ativar');

        $grupo = $this->usuarioService->ativar($id);

        return UsuarioResource::make($grupo)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/usuarios',
        summary: 'Admin — Listar usuários',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'grupo_id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'nome', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 255)),
            new OA\Parameter(name: 'excluido', in: 'query', schema: new OA\Schema(type: 'boolean')),
            new OA\Parameter(name: 'por_pagina', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 15)),
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista paginada de usuários.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/UsuarioListarItem')),
                new OA\Property(property: 'links', ref: '#/components/schemas/PaginationLinks', type: 'object'),
                new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta', type: 'object'),
            ], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function listar(ListarRequest $request): JsonResponse
    {
        $this->authorize('admin.usuario.listar');

        $grupos = $this->usuarioService->listar(UsuarioFiltroDTO::criarParaFiltro($request->validated()));

        return UsuarioListarResource::collection($grupos)->response()->setStatusCode(200);
    }
}
