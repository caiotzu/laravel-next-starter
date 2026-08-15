<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\MensagemService;

use App\Http\Requests\Admin\Mensagem\ListarRequest;
use App\Http\Requests\Admin\Mensagem\CadastrarRequest;
use App\Http\Requests\Admin\Mensagem\BuscarUsuarioRequest;

use App\DTO\Mensagem\MensagemFiltroDTO;
use App\DTO\Mensagem\MensagemCadastroDTO;
use App\DTO\Mensagem\MensagemBuscaUsuarioFiltroDTO;

use App\Http\Resources\Admin\Mensagem\MensagemResource;
use App\Http\Resources\Admin\Mensagem\MensagemVisualizarResource;
use App\Http\Resources\Admin\Mensagem\UsuarioBuscaResource;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'AdminMensagem',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'titulo', type: 'string', maxLength: 120),
        new OA\Property(property: 'conteudo', type: 'string'),
        new OA\Property(property: 'origem', type: 'string', enum: ['sistema', 'admin']),
        new OA\Property(property: 'remetente', properties: [
            new OA\Property(property: 'id', type: 'string', format: 'uuid'),
            new OA\Property(property: 'nome', type: 'string'),
        ], type: 'object', nullable: true),
        new OA\Property(property: 'direcionamento', properties: [
            new OA\Property(property: 'tipo', type: 'string', enum: ['geral', 'entidade', 'grupo_empresa', 'usuario']),
            new OA\Property(property: 'entidade_tipo', type: 'string', enum: ['admin', 'private'], nullable: true),
            new OA\Property(property: 'grupo_empresa_id', type: 'string', format: 'uuid', nullable: true),
            new OA\Property(property: 'grupo_empresa_nome', type: 'string', nullable: true),
            new OA\Property(property: 'usuario_id', type: 'string', format: 'uuid', nullable: true),
            new OA\Property(property: 'usuario_nome', type: 'string', nullable: true),
        ], type: 'object'),
        new OA\Property(property: 'total_destinatarios', type: 'integer', nullable: true),
        new OA\Property(property: 'total_lidos', type: 'integer', nullable: true),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'deleted_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object'
)]
class MensagemController extends Controller
{
    public function __construct(
        protected MensagemService $mensagemService,
    ) {}

    #[OA\Post(
        path: '/admin/mensagens',
        summary: 'Admin — Cadastrar/enviar mensagem',
        description: 'Cria e envia uma mensagem/notificação, com direcionamento configurável: geral (todos os usuários), por entidade (Admin ou Private), por grupo empresa, ou para um usuário específico.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['titulo', 'conteudo', 'direcionamento'],
            properties: [
                new OA\Property(property: 'titulo', type: 'string', maxLength: 120),
                new OA\Property(property: 'conteudo', type: 'string'),
                new OA\Property(property: 'direcionamento', required: ['tipo'], properties: [
                    new OA\Property(property: 'tipo', type: 'string', enum: ['geral', 'entidade', 'grupo_empresa', 'usuario']),
                    new OA\Property(property: 'entidade_tipo', type: 'string', enum: ['admin', 'private'], description: 'Obrigatório quando tipo = entidade.'),
                    new OA\Property(property: 'grupo_empresa_id', type: 'string', format: 'uuid', description: 'Obrigatório quando tipo = grupo_empresa.'),
                    new OA\Property(property: 'usuario_id', type: 'string', format: 'uuid', description: 'Obrigatório quando tipo = usuario.'),
                ], type: 'object'),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 201, description: 'Mensagem cadastrada e enviada.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AdminMensagem', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $this->authorize('admin.mensagem.cadastrar');

        $mensagem = $this->mensagemService->cadastrar(MensagemCadastroDTO::criarParaCadastro($request->validated()));

        return MensagemResource::make($mensagem)->response()->setStatusCode(201);
    }

    #[OA\Get(
        path: '/admin/mensagens/{id}',
        summary: 'Admin — Visualizar mensagem',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Mensagem encontrada.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AdminMensagem', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('admin.mensagem.visualizar');

        $mensagem = $this->mensagemService->visualizar($id);

        return MensagemVisualizarResource::make($mensagem)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/mensagens',
        summary: 'Admin — Listar mensagens enviadas',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'titulo', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 120)),
            new OA\Parameter(name: 'origem', in: 'query', schema: new OA\Schema(type: 'string', enum: ['sistema', 'admin'])),
            new OA\Parameter(name: 'por_pagina', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 15)),
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista paginada de mensagens.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/AdminMensagem')),
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
        $this->authorize('admin.mensagem.listar');

        $mensagens = $this->mensagemService->listar(MensagemFiltroDTO::criarParaFiltro($request->validated()));

        return MensagemResource::collection($mensagens)->response()->setStatusCode(200);
    }

    /**
     * Busca usuários de qualquer entidade/grupo/empresa do sistema, usada
     * exclusivamente para selecionar o destinatário individual no cadastro
     * de mensagem. Usa a mesma permissão de cadastro, já que só é acessada
     * a partir do formulário de envio.
     */
    #[OA\Get(
        path: '/admin/mensagens/usuarios',
        summary: 'Admin — Buscar usuários para destinatário de mensagem',
        description: 'Busca usuários de qualquer entidade (Admin ou Private) por nome, usada exclusivamente para selecionar o destinatário individual no formulário de envio de mensagem.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'nome', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 255)),
            new OA\Parameter(name: 'por_pagina', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 50, default: 15)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista de usuários.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(properties: [
                    new OA\Property(property: 'id', type: 'string', format: 'uuid'),
                    new OA\Property(property: 'nome', type: 'string'),
                    new OA\Property(property: 'email', type: 'string', format: 'email'),
                ], type: 'object')),
            ], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function buscarUsuarios(BuscarUsuarioRequest $request): JsonResponse
    {
        $this->authorize('admin.mensagem.cadastrar');

        $usuarios = $this->mensagemService->buscarUsuarios(
            MensagemBuscaUsuarioFiltroDTO::criarParaFiltro($request->validated())
        );

        return UsuarioBuscaResource::collection($usuarios)->response()->setStatusCode(200);
    }
}
