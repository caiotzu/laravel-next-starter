<?php

namespace App\Http\Controllers\Private;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

use App\Services\ChamadoService;

use App\Http\Requests\Private\Chamado\AbrirRequest;
use App\Http\Requests\Private\Chamado\ResponderRequest;
use App\Http\Requests\Private\Chamado\ListarRequest;

use App\DTO\Chamado\ChamadoAberturaDTO;
use App\DTO\Chamado\ChamadoRespostaDTO;
use App\DTO\Chamado\ChamadoFiltroDTO;
use App\DTO\Common\PaginationDTO;

use App\Http\Resources\Private\Chamado\ChamadoResource;
use App\Http\Resources\Private\Chamado\ChamadoMensagemResource;

use OpenApi\Attributes as OA;

class ChamadoController extends Controller
{
    public function __construct(
        protected ChamadoService $chamadoService,
    ) {}

    #[OA\Get(
        path: '/chamados',
        summary: 'Private — Listar meus chamados',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'tipo', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'por_pagina', in: 'query', schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', default: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista paginada dos chamados abertos pelo usuário autenticado.',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/PrivateChamado')),
                    new OA\Property(property: 'links', ref: '#/components/schemas/PaginationLinks', type: 'object'),
                    new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta', type: 'object'),
                ], type: 'object')
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
        ]
    )]
    public function listar(ListarRequest $request): JsonResponse
    {
        $this->authorize('private.chamado.listar');

        $chamados = $this->chamadoService->listarPrivate(
            Auth::id(),
            ChamadoFiltroDTO::criarParaFiltro($request->validated())
        );

        return ChamadoResource::collection($chamados)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/chamados/{id}',
        summary: 'Private — Visualizar chamado',
        description: '404 caso o chamado não exista ou não pertença ao usuário autenticado.',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Chamado com a conversa completa.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/PrivateChamado', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('private.chamado.listar');

        $chamado = $this->chamadoService->visualizarPrivate($id, Auth::id());

        return ChamadoResource::make($chamado)->response()->setStatusCode(200);
    }

    #[OA\Post(
        path: '/chamados',
        summary: 'Private — Abrir chamado',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['tipo', 'assunto', 'mensagem'],
            properties: [
                new OA\Property(property: 'tipo', type: 'string', enum: ['financeiro', 'plataforma', 'acesso', 'duvida', 'documentacao', 'operacional', 'outros']),
                new OA\Property(property: 'assunto', type: 'string', maxLength: 150),
                new OA\Property(property: 'mensagem', type: 'string'),
                new OA\Property(
                    property: 'anexos',
                    description: 'Opcional. Limite de quantidade e tamanho configurados em config(\'api.chamados\'). Cada anexo deve ser PDF, JPG, JPEG ou PNG.',
                    type: 'array',
                    nullable: true,
                    items: new OA\Items(required: ['nome', 'conteudo'], properties: [
                        new OA\Property(property: 'nome', type: 'string', maxLength: 255),
                        new OA\Property(property: 'conteudo', type: 'string', format: 'byte', description: 'Conteúdo do arquivo em base64.'),
                    ], type: 'object')
                ),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 201, description: 'Chamado aberto, com o ticket gerado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/PrivateChamado', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function abrir(AbrirRequest $request): JsonResponse
    {
        $this->authorize('private.chamado.abrir');

        $chamado = $this->chamadoService->abrir(
            ChamadoAberturaDTO::criarParaAbertura($request->validated(), Auth::id())
        );

        return ChamadoResource::make($chamado)->response()->setStatusCode(201);
    }

    #[OA\Post(
        path: '/chamados/{id}/mensagens',
        summary: 'Private — Responder chamado',
        description: '404 caso o chamado não pertença ao usuário autenticado. 422 caso o chamado já esteja encerrado (fechado/cancelado).',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['mensagem'],
            properties: [
                new OA\Property(property: 'mensagem', type: 'string'),
                new OA\Property(
                    property: 'anexos',
                    description: 'Opcional. Limite de quantidade e tamanho configurados em config(\'api.chamados\'). Cada anexo deve ser PDF, JPG, JPEG ou PNG.',
                    type: 'array',
                    nullable: true,
                    items: new OA\Items(required: ['nome', 'conteudo'], properties: [
                        new OA\Property(property: 'nome', type: 'string', maxLength: 255),
                        new OA\Property(property: 'conteudo', type: 'string', format: 'byte', description: 'Conteúdo do arquivo em base64.'),
                    ], type: 'object')
                ),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 201, description: 'Mensagem registrada na conversa.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/ChamadoMensagem', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function responder(string $id, ResponderRequest $request): JsonResponse
    {
        $this->authorize('private.chamado.responder');

        // Garante posse ANTES de responder — mesma checagem usada em
        // visualizar(), evitando que um ID de chamado de outro cliente
        // seja usado para inserir uma mensagem.
        $this->chamadoService->visualizarPrivate($id, Auth::id());

        $mensagem = $this->chamadoService->responder(
            $id,
            ChamadoRespostaDTO::criarParaResposta($request->validated(), Auth::id())
        );

        return ChamadoMensagemResource::make($mensagem)->response()->setStatusCode(201);
    }
}
