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
            new OA\Response(response: 200, description: 'Lista paginada de todos os chamados.'),
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
            new OA\Response(response: 200, description: 'Chamado com a conversa completa.'),
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
        responses: [
            new OA\Response(response: 201, description: 'Mensagem registrada na conversa.'),
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
        responses: [
            new OA\Response(response: 200, description: 'Status atualizado.'),
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
            \App\Enums\ChamadoStatus::from($request->validated('status'))
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
        responses: [
            new OA\Response(response: 200, description: 'Prioridade atualizada.'),
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
            \App\Enums\ChamadoPrioridade::from($request->validated('prioridade'))
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
        responses: [
            new OA\Response(response: 200, description: 'Responsável atualizado.'),
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
