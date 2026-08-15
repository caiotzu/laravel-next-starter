<?php

namespace App\Http\Controllers\Admin;


use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\GrupoService;

use App\Http\Requests\Admin\Grupo\ListarRequest;
use App\Http\Requests\Admin\Grupo\CadastrarRequest;
use App\Http\Requests\Admin\Grupo\AtualizarRequest;
use App\Http\Requests\Admin\Grupo\SincronizarPermissoesRequest;

use App\DTO\Grupo\GrupoFiltroDTO;
use App\DTO\Grupo\GrupoCadastroDTO;
use App\DTO\Grupo\GrupoAtualizacaoDTO;
use App\DTO\Grupo\SincronizarPermissoesDTO;

use App\Http\Resources\Admin\Grupo\GrupoResource;
use App\Http\Resources\Admin\Grupo\GrupoVisualizarResource;

use App\Enums\PermissaoTipo;

use OpenApi\Attributes as OA;

class GrupoController extends Controller
{
    public function __construct(
        protected GrupoService $grupoService,
    ) {}

    #[OA\Post(
        path: '/admin/grupos',
        summary: 'Admin — Cadastrar grupo',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['descricao'],
            properties: [new OA\Property(property: 'descricao', type: 'string', maxLength: 255, description: 'Deve ser única entre os grupos.')],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 201, description: 'Grupo cadastrado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Grupo', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $this->authorize('admin.grupo.cadastrar');

        $grupo = $this->grupoService->cadastrar(GrupoCadastroDTO::criarParaCadastro($request->validated()));

        return GrupoResource::make($grupo)->response()->setStatusCode(201);
    }

    #[OA\Put(
        path: '/admin/grupos/{id}',
        summary: 'Admin — Atualizar grupo',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['descricao'],
            properties: [new OA\Property(property: 'descricao', type: 'string', maxLength: 255)],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Grupo atualizado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Grupo', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function atualizar(AtualizarRequest $request, string $id): JsonResponse
    {
        $this->authorize('admin.grupo.atualizar');

        $grupo = $this->grupoService->atualizar(
            GrupoAtualizacaoDTO::criarParaAtualizacao(
                $id,
                $request->validated()
            )
        );

        return GrupoResource::make($grupo)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/grupos/{id}',
        summary: 'Admin — Visualizar grupo',
        description: 'Retorna o grupo com as permissões vinculadas e os usuários de cada permissão.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Grupo encontrado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/GrupoVisualizar', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('admin.grupo.visualizar');

        $grupo = $this->grupoService->visualizar($id);

        return GrupoVisualizarResource::make($grupo)->response()->setStatusCode(200);
    }

    #[OA\Delete(
        path: '/admin/grupos/{id}',
        summary: 'Admin — Excluir grupo',
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
        $this->authorize('admin.grupo.excluir');

        $this->grupoService->excluir($id);

        return response()->json(null, 204);
    }

    #[OA\Patch(
        path: '/admin/grupos/{id}/ativar',
        summary: 'Admin — Ativar/reativar grupo',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Grupo ativado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Grupo', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function ativar(string $id): JsonResponse
    {
        $this->authorize('admin.grupo.ativar');

        $grupo = $this->grupoService->ativar($id);

        return GrupoResource::make($grupo)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/grupos',
        summary: 'Admin — Listar grupos',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'descricao', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 255)),
            new OA\Parameter(name: 'excluido', in: 'query', schema: new OA\Schema(type: 'boolean')),
            new OA\Parameter(name: 'por_pagina', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 15)),
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista paginada de grupos.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Grupo')),
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
        $this->authorize('admin.grupo.listar');

        $grupos = $this->grupoService->listar(GrupoFiltroDTO::criarParaFiltro($request->validated()));

        return GrupoResource::collection($grupos)->response()->setStatusCode(200);
    }

    #[OA\Patch(
        path: '/admin/grupos/{id}/permissoes',
        summary: 'Admin — Sincronizar permissões do grupo',
        description: 'Substitui o conjunto de permissões do grupo pela lista informada (sincronização completa: remove as que não estiverem na lista e adiciona as novas).',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['permissoes'],
            properties: [
                new OA\Property(property: 'permissoes', type: 'array', minItems: 1, items: new OA\Items(type: 'string', format: 'uuid'), description: 'IDs das permissões a serem vinculadas ao grupo.'),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Permissões sincronizadas.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/GrupoVisualizar', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function sincronizarPermissoes(SincronizarPermissoesRequest $request, string $id)
    {
        $this->authorize('admin.grupo.sincronizar_permissao');

        $grupo = $this->grupoService->sincronizarPermissoes(SincronizarPermissoesDTO::criarParaSincronizacaoDasPermissoes(
            $id,
            PermissaoTipo::ADMIN,
            $request->validated()
        ));

        return GrupoVisualizarResource::make($grupo)->response()->setStatusCode(200);
    }
}
