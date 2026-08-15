<?php

namespace App\Http\Controllers\Global;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

use App\Services\MensagemDestinatarioService;

use App\Http\Requests\Global\Mensagem\ListarRequest;

use App\DTO\Mensagem\MensagemConsultaFiltroDTO;

use App\Http\Resources\Global\Mensagem\MensagemResource;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'GlobalMensagem',
    description: 'Mensagem/notificação do ponto de vista do destinatário. O `id` exposto é o do vínculo de destinatário (mensagem_destinatarios), usado nas ações de marcar como lida.',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'mensagem_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'titulo', type: 'string', example: 'Manutenção programada'),
        new OA\Property(property: 'conteudo', type: 'string', example: 'O sistema ficará indisponível das 02h às 04h.'),
        new OA\Property(property: 'origem', type: 'string', enum: ['sistema', 'admin']),
        new OA\Property(property: 'lida', type: 'boolean'),
        new OA\Property(property: 'lida_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
    ],
    type: 'object'
)]
class MensagemController extends Controller
{
    public function __construct(
        protected MensagemDestinatarioService $mensagemDestinatarioService,
    ) {}

    #[OA\Get(
        path: '/mensagens',
        summary: 'Global — Listar mensagens do usuário autenticado',
        description: 'Lista as mensagens/notificações recebidas pelo usuário autenticado, com filtro por lida/não lida e paginação.',
        security: [['bearerAuth' => []]],
        tags: ['Global'],
        parameters: [
            new OA\Parameter(name: 'lida', description: 'Filtra por mensagens lidas (true) ou não lidas (false).', in: 'query', schema: new OA\Schema(type: 'boolean')),
            new OA\Parameter(name: 'por_pagina', description: 'Itens por página (1 a 100).', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 15)),
            new OA\Parameter(name: 'page', description: 'Número da página.', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista paginada de mensagens.',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/GlobalMensagem')),
                    new OA\Property(property: 'links', ref: '#/components/schemas/PaginationLinks', type: 'object'),
                    new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta', type: 'object'),
                ], type: 'object')
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function listar(ListarRequest $request): JsonResponse
    {
        $mensagens = $this->mensagemDestinatarioService->listar(
            MensagemConsultaFiltroDTO::criarParaFiltro($request->validated()),
            Auth::id()
        );

        return MensagemResource::collection($mensagens)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/mensagens/{id}',
        summary: 'Global — Visualizar mensagem',
        description: 'Retorna os detalhes de uma mensagem recebida pelo usuário autenticado.',
        security: [['bearerAuth' => []]],
        tags: ['Global'],
        parameters: [
            new OA\Parameter(name: 'id', description: 'ID do vínculo de destinatário da mensagem.', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Mensagem encontrada.',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'data', ref: '#/components/schemas/GlobalMensagem', type: 'object'),
                ], type: 'object')
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function visualizar(string $id): JsonResponse
    {
        $destinatario = $this->mensagemDestinatarioService->visualizar($id, Auth::id());

        return MensagemResource::make($destinatario)->response()->setStatusCode(200);
    }

    #[OA\Patch(
        path: '/mensagens/{id}/marcar-lida',
        summary: 'Global — Marcar mensagem como lida',
        description: 'Marca uma mensagem recebida pelo usuário autenticado como lida.',
        security: [['bearerAuth' => []]],
        tags: ['Global'],
        parameters: [
            new OA\Parameter(name: 'id', description: 'ID do vínculo de destinatário da mensagem.', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Mensagem marcada como lida.',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'data', ref: '#/components/schemas/GlobalMensagem', type: 'object'),
                ], type: 'object')
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function marcarComoLida(string $id): JsonResponse
    {
        $destinatario = $this->mensagemDestinatarioService->marcarComoLida($id, Auth::id());

        return MensagemResource::make($destinatario)->response()->setStatusCode(200);
    }

    #[OA\Patch(
        path: '/mensagens/marcar-todas-lidas',
        summary: 'Global — Marcar todas as mensagens como lidas',
        description: 'Marca todas as mensagens não lidas do usuário autenticado como lidas.',
        security: [['bearerAuth' => []]],
        tags: ['Global'],
        responses: [
            new OA\Response(response: 204, ref: '#/components/responses/NoContent'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
        ]
    )]
    public function marcarTodasComoLidas(): JsonResponse
    {
        $this->mensagemDestinatarioService->marcarTodasComoLidas(Auth::id());

        return response()->json(null, 204);
    }

    #[OA\Get(
        path: '/mensagens/nao-lidas/contador',
        summary: 'Global — Contar mensagens não lidas',
        description: 'Retorna a quantidade de mensagens não lidas do usuário autenticado (uso comum: badge de notificações).',
        security: [['bearerAuth' => []]],
        tags: ['Global'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Contador de mensagens não lidas.',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'data', properties: [
                        new OA\Property(property: 'total_nao_lidas', type: 'integer', example: 3),
                    ], type: 'object'),
                ], type: 'object')
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
        ]
    )]
    public function contarNaoLidas(): JsonResponse
    {
        return response()->json([
            'data' => [
                'total_nao_lidas' => $this->mensagemDestinatarioService->contarNaoLidas(Auth::id()),
            ],
        ]);
    }
}
