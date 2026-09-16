<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

use App\Services\ChamadoService;

use App\Http\Requests\Admin\Chamado\ListarRequest;
use App\Http\Requests\Admin\Chamado\ResponderRequest;
use App\Http\Requests\Admin\Chamado\AtualizarStatusRequest;
use App\Http\Requests\Admin\Chamado\AtualizarPrioridadeRequest;
use App\Http\Requests\Admin\Chamado\AtribuirResponsavelRequest;

use App\DTO\Chamado\ChamadoFiltroDTO;
use App\DTO\Chamado\ChamadoRespostaDTO;

use App\Http\Resources\Admin\Chamado\ChamadoResource;
use App\Http\Resources\Admin\Chamado\ChamadoMensagemResource;

use OpenApi\Attributes as OA;

use App\Enums\ChamadoStatus;
use App\Enums\ChamadoPrioridade;



class ChamadoController extends Controller
{
    public function __construct(
        protected ChamadoService $chamadoService,
    ) {}

    #[OA\Get(
        path: '/admin/chamados',
        summary: 'Admin — Listar chamados',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'tipo', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'por_pagina', in: 'query', schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', default: 1)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista paginada de todos os chamados.',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/AdminChamado')),
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
        $this->authorize('admin.chamado.listar');

        $chamados = $this->chamadoService->listarAdmin(
            ChamadoFiltroDTO::criarParaFiltro($request->validated())
        );

        return ChamadoResource::collection($chamados)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/chamados/{id}',
        summary: 'Admin — Visualizar chamado',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Chamado com a conversa completa.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AdminChamado', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('admin.chamado.listar');

        $chamado = $this->chamadoService->visualizarAdmin($id);

        return ChamadoResource::make($chamado)->response()->setStatusCode(200);
    }

    #[OA\Post(
        path: '/admin/chamados/{id}/mensagens',
        summary: 'Admin — Responder chamado',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
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
        $this->authorize('admin.chamado.responder');

        $mensagem = $this->chamadoService->responder(
            $id,
            ChamadoRespostaDTO::criarParaResposta($request->validated(), Auth::id())
        );

        return ChamadoMensagemResource::make($mensagem)->response()->setStatusCode(201);
    }

    #[OA\Patch(
        path: '/admin/chamados/{id}/status',
        summary: 'Admin — Atualizar status do chamado',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['status'],
            properties: [
                new OA\Property(property: 'status', type: 'string', enum: ['aberto', 'em_atendimento', 'aguardando_cliente', 'aguardando_suporte', 'resolvido', 'fechado', 'cancelado']),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Status atualizado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AdminChamado', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function atualizarStatus(string $id, AtualizarStatusRequest $request): JsonResponse
    {
        $this->authorize('admin.chamado.gerenciar');

        $chamado = $this->chamadoService->atualizarStatus(
            $id,
            ChamadoStatus::from($request->validated('status'))
        );

        return ChamadoResource::make($chamado)->response()->setStatusCode(200);
    }

    #[OA\Patch(
        path: '/admin/chamados/{id}/prioridade',
        summary: 'Admin — Atualizar prioridade do chamado',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['prioridade'],
            properties: [
                new OA\Property(property: 'prioridade', type: 'string', enum: ['baixa', 'normal', 'alta', 'urgente']),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Prioridade atualizada.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AdminChamado', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function atualizarPrioridade(string $id, AtualizarPrioridadeRequest $request): JsonResponse
    {
        $this->authorize('admin.chamado.gerenciar');

        $chamado = $this->chamadoService->atualizarPrioridade(
            $id,
           ChamadoPrioridade::from($request->validated('prioridade'))
        );

        return ChamadoResource::make($chamado)->response()->setStatusCode(200);
    }

    #[OA\Patch(
        path: '/admin/chamados/{id}/responsavel',
        summary: 'Admin — Definir responsável pelo chamado',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'responsavel_id', type: 'string', format: 'uuid', nullable: true, description: 'Envie null para remover o responsável atual.'),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Responsável atualizado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AdminChamado', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function atribuirResponsavel(string $id, AtribuirResponsavelRequest $request): JsonResponse
    {
        $this->authorize('admin.chamado.gerenciar');

        $chamado = $this->chamadoService->atribuirResponsavel(
            $id,
            $request->validated('responsavel_id')
        );

        return ChamadoResource::make($chamado)->response()->setStatusCode(200);
    }
}
