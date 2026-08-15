<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\AuditoriaService;
use App\Enums\AuditoriaEntidade;

use App\Http\Requests\Admin\Auditoria\ListarRequest;
use App\Http\Requests\Admin\Auditoria\ListarEntidadeRequest;

use App\DTO\Auditoria\AuditoriaFiltroDTO;
use App\DTO\Auditoria\AuditoriaEntidadeFiltroDTO;

use App\Http\Resources\Admin\Auditoria\AuditoriaResource;
use App\Http\Resources\Admin\Auditoria\AuditoriaEntidadeResource;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Auditoria',
    description: 'Registro de auditoria (trilha de alterações) do sistema.',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'entidade_tabela', type: 'string', example: 'empresas'),
        new OA\Property(property: 'entidade_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'registro', type: 'string', nullable: true, description: 'Label legível do registro auditado no momento da ação.'),
        new OA\Property(property: 'agrupador_tabela', type: 'string', nullable: true),
        new OA\Property(property: 'agrupador_id', type: 'string', format: 'uuid', nullable: true),
        new OA\Property(property: 'acao', type: 'string', enum: ['cadastro', 'atualizacao', 'exclusao', 'restauracao']),
        new OA\Property(property: 'origem', type: 'string', enum: ['api', 'console', 'job', 'sistema']),
        new OA\Property(property: 'dados_antes', type: 'object', nullable: true),
        new OA\Property(property: 'dados_depois', type: 'object', nullable: true),
        new OA\Property(property: 'campos_alterados', type: 'array', items: new OA\Items(type: 'string'), nullable: true),
        new OA\Property(property: 'ip', type: 'string', nullable: true),
        new OA\Property(property: 'user_agent', type: 'string', nullable: true),
        new OA\Property(property: 'criado_em', type: 'string', format: 'date-time'),
        new OA\Property(property: 'usuario', properties: [
            new OA\Property(property: 'id', type: 'string', format: 'uuid'),
            new OA\Property(property: 'nome', type: 'string'),
            new OA\Property(property: 'email', type: 'string', format: 'email'),
        ], type: 'object', nullable: true),
    ],
    type: 'object'
)]
#[OA\Schema(
    schema: 'AuditoriaEntidadeRegistro',
    description: 'Item enxuto (id + label) usado para popular filtros de registros auditáveis (ex.: qual empresa/usuário/grupo).',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'label', type: 'string'),
    ],
    type: 'object'
)]
class AuditoriaController extends Controller
{
    public function __construct(
        protected AuditoriaService $auditoriaService,
    ) {}

    #[OA\Get(
        path: '/admin/auditorias',
        summary: 'Admin — Listar registros de auditoria',
        description: 'Lista os registros de auditoria do sistema, com diversos filtros combináveis.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'entidade_tabela', description: 'Nome da tabela/entidade auditada (ex.: empresas, usuarios, grupos). Obrigatório se incluir_dependentes=true.', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 60)),
            new OA\Parameter(name: 'entidade_id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'agrupador_tabela', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 60)),
            new OA\Parameter(name: 'agrupador_id', description: 'Obrigatório se agrupador_tabela for informado.', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'incluir_dependentes', description: 'Incluir registros de entidades dependentes. Não pode ser usado junto com agrupador_tabela/agrupador_id.', in: 'query', schema: new OA\Schema(type: 'boolean')),
            new OA\Parameter(name: 'acao', in: 'query', schema: new OA\Schema(type: 'string', enum: ['cadastro', 'atualizacao', 'exclusao', 'restauracao'])),
            new OA\Parameter(name: 'usuario_id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'data_inicio', in: 'query', schema: new OA\Schema(type: 'string', format: 'date', example: '2026-01-01')),
            new OA\Parameter(name: 'data_fim', description: 'Deve ser igual ou posterior a data_inicio.', in: 'query', schema: new OA\Schema(type: 'string', format: 'date', example: '2026-01-31')),
            new OA\Parameter(name: 'por_pagina', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 15)),
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista paginada de registros de auditoria.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Auditoria')),
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
        $this->authorize('admin.auditoria.listar');

        $auditorias = $this->auditoriaService->listar(
            AuditoriaFiltroDTO::criarParaFiltro($request->validated())
        );

        return AuditoriaResource::collection($auditorias)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/auditorias/entidades',
        summary: 'Admin — Listar entidades auditáveis',
        description: 'Lista as entidades/tabelas disponíveis para filtro de auditoria (ex.: empresas, usuarios, grupos), com chave e label legível.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        responses: [
            new OA\Response(response: 200, description: 'Lista de entidades auditáveis.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(properties: [
                    new OA\Property(property: 'chave', type: 'string', enum: ['empresas', 'usuarios', 'grupos']),
                    new OA\Property(property: 'label', type: 'string'),
                ], type: 'object')),
            ], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
        ]
    )]
    public function listarEntidadesAuditaveis(): JsonResponse
    {
        $this->authorize('admin.auditoria.listar');

        return response()->json([
            'data' => $this->auditoriaService->listarEntidadesAuditaveis(),
        ]);
    }

    #[OA\Get(
        path: '/admin/auditorias/usuarios',
        summary: 'Admin — Listar usuários para filtro de auditoria',
        description: 'Lista usuários (id + label) para popular o filtro "usuario_id" da listagem de auditoria.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'busca', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 255)),
            new OA\Parameter(name: 'por_pagina', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 15)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista de usuários.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/AuditoriaEntidadeRegistro')),
            ], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function listarUsuarios(ListarEntidadeRequest $request): JsonResponse
    {
        $this->authorize('admin.auditoria.listar');

        $usuarios = $this->auditoriaService->listarRegistrosEntidade(
            AuditoriaEntidade::USUARIOS,
            AuditoriaEntidadeFiltroDTO::criarParaFiltro($request->validated()),
        );

        return AuditoriaEntidadeResource::collection($usuarios)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/auditorias/entidades/{entidade}',
        summary: 'Admin — Listar registros de uma entidade para filtro de auditoria',
        description: 'Lista registros (id + label) de uma entidade específica (empresas, usuarios ou grupos), usada para popular o filtro "entidade_id" da listagem de auditoria.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'entidade', description: 'Chave da entidade auditável.', in: 'path', required: true, schema: new OA\Schema(type: 'string', enum: ['empresas', 'usuarios', 'grupos'])),
            new OA\Parameter(name: 'busca', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 255)),
            new OA\Parameter(name: 'por_pagina', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 15)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista de registros da entidade.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/AuditoriaEntidadeRegistro')),
            ], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function listarRegistrosEntidade(
        ListarEntidadeRequest $request,
        string $entidade,
    ): JsonResponse {
        $this->authorize('admin.auditoria.listar');

        $entidadeAuditavel = AuditoriaEntidade::tryFrom($entidade);

        abort_unless($entidadeAuditavel, 404);

        $registros = $this->auditoriaService->listarRegistrosEntidade(
            $entidadeAuditavel,
            AuditoriaEntidadeFiltroDTO::criarParaFiltro($request->validated()),
        );

        return AuditoriaEntidadeResource::collection($registros)->response()->setStatusCode(200);
    }
}
