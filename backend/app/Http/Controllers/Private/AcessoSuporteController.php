<?php

namespace App\Http\Controllers\Private;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

use App\Services\AcessoSuporteService;

use App\Http\Requests\Private\AcessoSuporte\ConcederRequest;
use App\Http\Requests\Private\AcessoSuporte\ListarRequest;

use App\DTO\AcessoSuporte\AcessoSuporteConcessaoDTO;
use App\DTO\Common\PaginationDTO;

use App\Http\Resources\Private\AcessoSuporte\AcessoSuporteResource;

use OpenApi\Attributes as OA;

class AcessoSuporteController extends Controller
{
    public function __construct(
        protected AcessoSuporteService $acessoSuporteService,
    ) {}

    #[OA\Post(
        path: '/acessos-suporte',
        summary: 'Private — Conceder acesso de suporte',
        description: 'Autoriza um administrador a acessar temporariamente os dados da sua organização, por um prazo limitado e obrigatório.',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['usuario_admin_id', 'duracao_minutos'],
            properties: [
                new OA\Property(property: 'usuario_admin_id', type: 'string', format: 'uuid'),
                new OA\Property(property: 'empresa_id', type: 'string', format: 'uuid', nullable: true),
                new OA\Property(property: 'motivo', type: 'string', nullable: true),
                new OA\Property(property: 'duracao_minutos', type: 'integer', example: 30),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 201, description: 'Acesso de suporte concedido.'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function conceder(ConcederRequest $request): JsonResponse
    {
        $this->authorize('private.acesso_suporte.conceder');

        $concedente = Auth::user();

        $acesso = $this->acessoSuporteService->conceder(
            AcessoSuporteConcessaoDTO::criarParaCadastro(
                $concedente->grupo->entidade_tipo_id,
                $concedente->grupo->entidade_id,
                $concedente->id,
                $request->validated()
            )
        );

        return AcessoSuporteResource::make($acesso)->response()->setStatusCode(201);
    }

    #[OA\Get(
        path: '/acessos-suporte',
        summary: 'Private — Listar acessos de suporte concedidos',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        parameters: [
            new OA\Parameter(name: 'por_pagina', description: 'Itens por página (1 a 100).', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 10)),
            new OA\Parameter(name: 'page', description: 'Número da página.', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista paginada de acessos de suporte concedidos pela organização.',
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
        $this->authorize('private.acesso_suporte.listar');

        $acessos = $this->acessoSuporteService->listarConcedidos(
            Auth::user(),
            PaginationDTO::criarParaPaginar($request->validated())
        );

        return AcessoSuporteResource::collection($acessos)->response()->setStatusCode(200);
    }

    #[OA\Delete(
        path: '/acessos-suporte/{id}',
        summary: 'Private — Revogar acesso de suporte',
        description: 'Encerra imediatamente um acesso de suporte concedido, independentemente do tempo restante.',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 204, description: 'Acesso revogado.'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function revogar(string $id): JsonResponse
    {
        $this->authorize('private.acesso_suporte.revogar');

        $this->acessoSuporteService->revogar($id, Auth::user());

        return response()->json(null, 204);
    }
}
