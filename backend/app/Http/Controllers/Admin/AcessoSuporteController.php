<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

use App\Services\AcessoSuporteService;

use App\Http\Requests\Admin\AcessoSuporte\ListarRequest;

use App\DTO\Common\PaginationDTO;

use App\Http\Resources\Admin\AcessoSuporte\AcessoSuporteResource;

use OpenApi\Attributes as OA;

class AcessoSuporteController extends Controller
{
    public function __construct(
        protected AcessoSuporteService $acessoSuporteService,
    ) {}

    #[OA\Get(
        path: '/admin/acessos-suporte',
        summary: 'Admin — Listar acessos de suporte recebidos',
        description: 'Lista os acessos de suporte concedidos a este administrador por clientes Private, incluindo os já expirados/encerrados.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'por_pagina', description: 'Itens por página (1 a 100).', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 10)),
            new OA\Parameter(name: 'page', description: 'Número da página.', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista paginada de acessos de suporte recebidos.',
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
        $this->authorize('admin.acesso_suporte.listar');

        $acessos = $this->acessoSuporteService->listarRecebidos(
            Auth::user(),
            PaginationDTO::criarParaPaginar($request->validated())
        );

        return AcessoSuporteResource::collection($acessos)->response()->setStatusCode(200);
    }

    #[OA\Delete(
        path: '/admin/acessos-suporte/{id}',
        summary: 'Admin — Encerrar acesso de suporte',
        description: 'Encerra, pelo próprio administrador, um acesso de suporte em uso ("Encerrar acesso de suporte" na UI).',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 204, description: 'Acesso encerrado.'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function encerrar(string $id): JsonResponse
    {
        $this->authorize('admin.acesso_suporte.encerrar');

        $this->acessoSuporteService->encerrar($id, Auth::user());

        return response()->json(null, 204);
    }
}
