<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\BannerService;

use App\Http\Requests\Admin\Banner\ListarRequest;
use App\Http\Requests\Admin\Banner\CadastrarRequest;
use App\Http\Requests\Admin\Banner\AtualizarRequest;

use App\DTO\Banner\BannerFiltroDTO;
use App\DTO\Banner\BannerCadastroDTO;
use App\DTO\Banner\BannerAtualizacaoDTO;

use App\Enums\EntidadeTipo as EntidadeTipoChave;

use App\Http\Resources\Admin\Banner\BannerResource;
use App\Http\Resources\Admin\Banner\BannerDisponivelResource;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'AdminBanner',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'titulo', type: 'string', maxLength: 120),
        new OA\Property(property: 'conteudo', type: 'string', nullable: true),
        new OA\Property(property: 'status', type: 'string', enum: ['ativo', 'inativo']),
        new OA\Property(property: 'direcionamento', properties: [
            new OA\Property(property: 'tipo', type: 'string', enum: ['geral', 'entidade']),
            new OA\Property(property: 'entidade_tipo', type: 'string', enum: ['admin', 'private'], nullable: true),
        ], type: 'object'),
        new OA\Property(property: 'inicio_em', type: 'string', format: 'date-time'),
        new OA\Property(property: 'fim_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'imagens', type: 'array', items: new OA\Items(properties: [
            new OA\Property(property: 'id', type: 'string', format: 'uuid'),
            new OA\Property(property: 'url', type: 'string'),
            new OA\Property(property: 'ordem', type: 'integer'),
        ], type: 'object')),
        new OA\Property(property: 'links', type: 'array', items: new OA\Items(properties: [
            new OA\Property(property: 'id', type: 'string', format: 'uuid'),
            new OA\Property(property: 'nome', type: 'string'),
            new OA\Property(property: 'url', type: 'string'),
            new OA\Property(property: 'ordem', type: 'integer'),
        ], type: 'object')),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'deleted_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object'
)]
class BannerController extends Controller
{
    public function __construct(
        protected BannerService $bannerService,
    ) {}

    #[OA\Get(
        path: '/admin/banners',
        summary: 'Admin — Listar banners',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'titulo', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 120)),
            new OA\Parameter(name: 'status', in: 'query', schema: new OA\Schema(type: 'string', enum: ['ativo', 'inativo'])),
            new OA\Parameter(name: 'por_pagina', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 15)),
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista paginada de banners.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/AdminBanner')),
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
        $this->authorize('admin.banner.listar');

        $banners = $this->bannerService->listar(BannerFiltroDTO::criarParaFiltro($request->validated()));

        return BannerResource::collection($banners)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/banners/disponiveis',
        summary: 'Admin — Listar banners disponíveis',
        description: 'Mesmo conceito do endpoint equivalente do Private (ver PrivateBannerController::disponiveis): retorna somente os banners elegíveis para o usuário Admin autenticado NESTE momento — ativos, dentro do período da campanha e com direcionamento compatível (todos ou entidade Admin). Não requer nenhuma permissão administrativa específica, pelo mesmo motivo do Private: é a exibição de uma campanha, não uma ação de gestão.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de banners disponíveis (pode ser vazia).',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'data', type: 'array', items: new OA\Items(properties: [
                        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
                        new OA\Property(property: 'titulo', type: 'string'),
                        new OA\Property(property: 'conteudo', type: 'string', nullable: true),
                        new OA\Property(property: 'imagens', type: 'array', items: new OA\Items(properties: [
                            new OA\Property(property: 'id', type: 'string', format: 'uuid'),
                            new OA\Property(property: 'url', type: 'string'),
                            new OA\Property(property: 'ordem', type: 'integer'),
                        ], type: 'object')),
                        new OA\Property(property: 'links', type: 'array', items: new OA\Items(properties: [
                            new OA\Property(property: 'id', type: 'string', format: 'uuid'),
                            new OA\Property(property: 'nome', type: 'string'),
                            new OA\Property(property: 'url', type: 'string'),
                        ], type: 'object')),
                    ], type: 'object')),
                ], type: 'object')
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
        ]
    )]
    public function disponiveis(): JsonResponse
    {
        $banners = $this->bannerService->disponiveisPara(EntidadeTipoChave::ADMIN);

        return BannerDisponivelResource::collection($banners)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/banners/{id}',
        summary: 'Admin — Visualizar banner',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Banner encontrado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AdminBanner', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('admin.banner.visualizar');

        $banner = $this->bannerService->visualizar($id);

        return BannerResource::make($banner)->response()->setStatusCode(200);
    }

    #[OA\Post(
        path: '/admin/banners',
        summary: 'Admin — Cadastrar banner',
        description: 'Cria uma campanha de banner. Requer ao menos uma imagem, período de campanha e direcionamento (todos ou por entidade).',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['titulo', 'inicio_em', 'direcionamento', 'imagens'],
            properties: [
                new OA\Property(property: 'titulo', type: 'string', maxLength: 120),
                new OA\Property(property: 'conteudo', type: 'string', nullable: true),
                new OA\Property(property: 'inicio_em', type: 'string', format: 'date-time'),
                new OA\Property(property: 'fim_em', type: 'string', format: 'date-time', nullable: true, description: 'Deve ser posterior a inicio_em.'),
                new OA\Property(property: 'direcionamento', required: ['tipo'], properties: [
                    new OA\Property(property: 'tipo', type: 'string', enum: ['geral', 'entidade']),
                    new OA\Property(property: 'entidade_tipo', type: 'string', enum: ['admin', 'private'], nullable: true, description: "Obrigatório quando tipo = 'entidade'."),
                ], type: 'object'),
                new OA\Property(
                    property: 'imagens',
                    description: 'Ao menos 1 e no máximo 10 imagens.',
                    type: 'array',
                    items: new OA\Items(required: ['conteudo'], properties: [
                        new OA\Property(property: 'nome', type: 'string', maxLength: 255, nullable: true),
                        new OA\Property(property: 'conteudo', type: 'string', format: 'byte', description: 'Conteúdo da imagem em base64.'),
                    ], type: 'object')
                ),
                new OA\Property(
                    property: 'links',
                    description: 'Opcional, no máximo 10 links.',
                    type: 'array',
                    nullable: true,
                    items: new OA\Items(required: ['nome', 'url'], properties: [
                        new OA\Property(property: 'nome', type: 'string', maxLength: 60),
                        new OA\Property(property: 'url', type: 'string', maxLength: 2048, format: 'uri'),
                    ], type: 'object')
                ),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 201, description: 'Banner cadastrado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AdminBanner', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $this->authorize('admin.banner.cadastrar');

        $banner = $this->bannerService->cadastrar(BannerCadastroDTO::criarParaCadastro($request->validated()));

        return BannerResource::make($banner)->response()->setStatusCode(201);
    }

    #[OA\Put(
        path: '/admin/banners/{id}',
        summary: 'Admin — Atualizar banner',
        description: 'Cada item de "imagens" deve trazer OU um id (imagem existente mantida) OU nome+conteudo (imagem nova). Toda imagem ausente do array é removida.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['titulo', 'inicio_em', 'direcionamento', 'imagens'],
            properties: [
                new OA\Property(property: 'titulo', type: 'string', maxLength: 120),
                new OA\Property(property: 'conteudo', type: 'string', nullable: true),
                new OA\Property(property: 'inicio_em', type: 'string', format: 'date-time'),
                new OA\Property(property: 'fim_em', type: 'string', format: 'date-time', nullable: true, description: 'Deve ser posterior a inicio_em.'),
                new OA\Property(property: 'direcionamento', required: ['tipo'], properties: [
                    new OA\Property(property: 'tipo', type: 'string', enum: ['geral', 'entidade']),
                    new OA\Property(property: 'entidade_tipo', type: 'string', enum: ['admin', 'private'], nullable: true, description: "Obrigatório quando tipo = 'entidade'."),
                ], type: 'object'),
                new OA\Property(
                    property: 'imagens',
                    description: 'Ao menos 1 e no máximo 10 imagens.',
                    type: 'array',
                    items: new OA\Items(properties: [
                        new OA\Property(property: 'id', type: 'string', format: 'uuid', nullable: true, description: 'Preenchido para manter uma imagem já existente.'),
                        new OA\Property(property: 'nome', type: 'string', maxLength: 255, nullable: true),
                        new OA\Property(property: 'conteudo', type: 'string', format: 'byte', nullable: true, description: 'Obrigatório (base64) quando a imagem é nova, ou seja, sem id.'),
                    ], type: 'object')
                ),
                new OA\Property(
                    property: 'links',
                    description: 'Opcional, no máximo 10 links.',
                    type: 'array',
                    nullable: true,
                    items: new OA\Items(required: ['nome', 'url'], properties: [
                        new OA\Property(property: 'nome', type: 'string', maxLength: 60),
                        new OA\Property(property: 'url', type: 'string', maxLength: 2048, format: 'uri'),
                    ], type: 'object')
                ),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Banner atualizado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AdminBanner', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function atualizar(AtualizarRequest $request, string $id): JsonResponse
    {
        $this->authorize('admin.banner.atualizar');

        $banner = $this->bannerService->atualizar(BannerAtualizacaoDTO::criarParaAtualizacao($id, $request->validated()));

        return BannerResource::make($banner)->response()->setStatusCode(200);
    }

    #[OA\Patch(
        path: '/admin/banners/{id}/ativar',
        summary: 'Admin — Ativar banner',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Banner ativado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AdminBanner', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function ativar(string $id): JsonResponse
    {
        $this->authorize('admin.banner.atualizar');

        $banner = $this->bannerService->ativar($id);

        return BannerResource::make($banner)->response()->setStatusCode(200);
    }

    #[OA\Patch(
        path: '/admin/banners/{id}/desativar',
        summary: 'Admin — Desativar banner',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Banner desativado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AdminBanner', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function desativar(string $id): JsonResponse
    {
        $this->authorize('admin.banner.atualizar');

        $banner = $this->bannerService->desativar($id);

        return BannerResource::make($banner)->response()->setStatusCode(200);
    }

    #[OA\Delete(
        path: '/admin/banners/{id}',
        summary: 'Admin — Excluir banner',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 204, ref: '#/components/responses/NoContent'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function excluir(string $id): JsonResponse
    {
        $this->authorize('admin.banner.excluir');

        $this->bannerService->excluir($id);

        return response()->json(null, 204);
    }
}
