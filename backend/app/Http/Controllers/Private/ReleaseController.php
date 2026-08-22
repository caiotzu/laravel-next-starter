<?php

namespace App\Http\Controllers\Private;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\ReleaseService;

use App\Http\Requests\Private\Release\ListarRequest;

use App\DTO\Common\PaginationDTO;

use App\Enums\EntidadeTipo as EntidadeTipoChave;

use App\Http\Resources\Private\Release\ReleaseResource;

use OpenApi\Attributes as OA;

class ReleaseController extends Controller
{
    public function __construct(
        protected ReleaseService $releaseService,
    ) {}

    #[OA\Get(
        path: '/releases',
        summary: 'Private — Listar releases publicadas',
        description: 'Lista as novidades/melhorias/correções publicadas para o contexto Private. Nunca retorna releases em rascunho nem de outros contextos.',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        parameters: [
            new OA\Parameter(name: 'por_pagina', description: 'Itens por página (1 a 100).', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 10)),
            new OA\Parameter(name: 'page', description: 'Número da página.', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista paginada de releases publicadas.',
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
        $this->authorize('private.release.listar');

        $releases = $this->releaseService->listarPublicadas(
            EntidadeTipoChave::PRIVATE,
            PaginationDTO::criarParaPaginar($request->validated())
        );

        return ReleaseResource::collection($releases)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/releases/{id}',
        summary: 'Private — Visualizar release',
        description: 'Retorna uma release publicada do contexto Private. 404 se não existir, estiver em rascunho ou pertencer a outro contexto.',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Release encontrada.',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'data', type: 'object'),
                ], type: 'object')
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('private.release.listar');

        $release = $this->releaseService->buscarPublicada($id, EntidadeTipoChave::PRIVATE);

        return ReleaseResource::make($release)->response()->setStatusCode(200);
    }
}
