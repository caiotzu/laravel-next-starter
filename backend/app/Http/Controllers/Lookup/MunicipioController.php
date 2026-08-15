<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\MunicipioService;

use App\DTO\Lookup\Municipio\MunicipioFiltroDTO;

use App\Http\Requests\Lookup\Municipio\ListarRequest;

use App\Http\Resources\Lookup\Municipio\MunicipioResource;

use OpenApi\Attributes as OA;

class MunicipioController extends Controller
{
    public function __construct(
        protected MunicipioService $municipioService
    ) {}

    #[OA\Get(
        path: '/lookup/municipios',
        summary: 'Lookup — Listar municípios',
        description: 'Lista municípios cadastrados, com filtros e paginação. Ordenado por nome (ASC).',
        security: [['bearerAuth' => []]],
        tags: ['Lookup'],
        parameters: [
            new OA\Parameter(name: 'nome', description: 'Filtro por nome do município (busca parcial, case-insensitive).', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 255)),
            new OA\Parameter(name: 'uf', description: 'Filtro por UF (2 letras).', in: 'query', schema: new OA\Schema(type: 'string', enum: ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'])),
            new OA\Parameter(name: 'codigo_ibge', description: 'Filtro por código IBGE (7 dígitos).', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 7)),
            new OA\Parameter(name: 'codigo_siafi', description: 'Filtro por código SIAFI.', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 10)),
            new OA\Parameter(name: 'por_pagina', description: 'Itens por página (1 a 100).', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 15)),
            new OA\Parameter(name: 'page', description: 'Número da página.', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista paginada de municípios.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(properties: [
                                new OA\Property(property: 'id', type: 'string', format: 'uuid'),
                                new OA\Property(property: 'nome', type: 'string', example: 'São Paulo'),
                                new OA\Property(property: 'uf', type: 'string', example: 'SP'),
                                new OA\Property(property: 'codigo_ibge', type: 'string', example: '3550308'),
                                new OA\Property(property: 'codigo_siafi', type: 'string', example: '7107'),
                            ], type: 'object')
                        ),
                        new OA\Property(property: 'links', ref: '#/components/schemas/PaginationLinks', type: 'object'),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta', type: 'object'),
                    ],
                    type: 'object'
                )
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function listar(ListarRequest $request): JsonResponse
    {
        $municipios = $this->municipioService->listar(MunicipioFiltroDTO::criarParaFiltro($request->validated()));

        return MunicipioResource::collection($municipios)->response()->setStatusCode(200);
    }
}
