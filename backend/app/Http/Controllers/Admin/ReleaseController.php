<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\ReleaseService;

use App\Http\Requests\Admin\Release\ListarRequest;
use App\Http\Requests\Admin\Release\AtualizarRequest;
use App\Http\Requests\Admin\Release\CadastrarRequest;

use App\DTO\Release\ReleaseFiltroDTO;
use App\DTO\Release\ReleaseCadastroDTO;
use App\DTO\Release\ReleaseAtualizacaoDTO;

use App\Http\Resources\Admin\Release\ReleaseResource;

use OpenApi\Attributes as OA;

/**
 * Gerenciamento completo de Releases (qualquer contexto, qualquer status).
 * Mesmo padrão de autorização granular por ação já usado em
 * Empresa/Grupo/Usuario — não existe uma "área de leitura" separada da
 * "área de gerenciamento": quem tem admin.release.listar já vê tudo (draft
 * e published, de qualquer contexto) e filtra via query string; a tela de
 * "Releases" do próprio Admin (novidades do painel Admin) é só este mesmo
 * endpoint chamado com ?contexto=admin&status=published.
 */
class ReleaseController extends Controller
{
    public function __construct(
        protected ReleaseService $releaseService,
    ) {}

    #[OA\Get(
        path: '/admin/releases',
        summary: 'Admin — Listar releases',
        description: 'Lista releases de qualquer contexto/status, com filtros opcionais. Usado tanto para a tela de gerenciamento quanto para a tela de "novidades" do próprio Admin (filtrando contexto=admin&status=published).',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'contexto', in: 'query', schema: new OA\Schema(type: 'string', enum: ['admin', 'private'])),
            new OA\Parameter(name: 'status', in: 'query', schema: new OA\Schema(type: 'string', enum: ['draft', 'published'])),
            new OA\Parameter(name: 'tipo', in: 'query', schema: new OA\Schema(type: 'string', enum: ['feature', 'improvement', 'fix', 'change'])),
            new OA\Parameter(name: 'por_pagina', description: 'Itens por página (1 a 100).', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 10)),
            new OA\Parameter(name: 'page', description: 'Número da página.', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista paginada de releases.',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'links', ref: '#/components/schemas/PaginationLinks', type: 'object'),
                    new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta', type: 'object'),
                ], type: 'object')
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function listar(ListarRequest $request): JsonResponse
    {
        $this->authorize('admin.release.listar');

        $releases = $this->releaseService->listarTodas(
            ReleaseFiltroDTO::criarParaFiltro($request->validated())
        );

        return ReleaseResource::collection($releases)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/releases/{id}',
        summary: 'Admin — Visualizar release',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Release encontrada.'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('admin.release.listar');

        $release = $this->releaseService->obter($id);

        return ReleaseResource::make($release)->response()->setStatusCode(200);
    }

    #[OA\Post(
        path: '/admin/releases',
        summary: 'Admin — Cadastrar release',
        description: 'Cria uma release em rascunho (DRAFT). Use o endpoint de publicação para torná-la visível aos usuários finais.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        responses: [
            new OA\Response(response: 201, description: 'Release criada.'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $this->authorize('admin.release.cadastrar');

        $release = $this->releaseService->criar(
            ReleaseCadastroDTO::criarParaCadastro($request->validated())
        );

        return ReleaseResource::make($release)->response()->setStatusCode(201);
    }

    #[OA\Put(
        path: '/admin/releases/{id}',
        summary: 'Admin — Atualizar release',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Release atualizada.'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function atualizar(string $id, AtualizarRequest $request): JsonResponse
    {
        $this->authorize('admin.release.editar');

        $release = $this->releaseService->atualizar(
            $id,
            ReleaseAtualizacaoDTO::criarParaAtualizacao($request->validated())
        );

        return ReleaseResource::make($release)->response()->setStatusCode(200);
    }

    #[OA\Patch(
        path: '/admin/releases/{id}/publicar',
        summary: 'Admin — Publicar release',
        description: 'Torna a release visível aos usuários finais do seu contexto. Idempotente: publicar novamente uma release já publicada não altera a data de publicação original.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Release publicada.'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function publicar(string $id): JsonResponse
    {
        $this->authorize('admin.release.publicar');

        $release = $this->releaseService->publicar($id);

        return ReleaseResource::make($release)->response()->setStatusCode(200);
    }
}
