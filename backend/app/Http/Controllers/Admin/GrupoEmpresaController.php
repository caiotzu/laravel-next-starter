<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\GrupoEmpresaService;

use App\Http\Requests\Admin\GrupoEmpresa\ListarRequest;
use App\Http\Requests\Admin\GrupoEmpresa\CadastrarRequest;
use App\Http\Requests\Admin\GrupoEmpresa\AtualizarRequest;

use App\DTO\GrupoEmpresa\GrupoEmpresaFiltroDTO;
use App\DTO\GrupoEmpresa\GrupoEmpresaCadastroDTO;
use App\DTO\GrupoEmpresa\GrupoEmpresaAtualizacaoDTO;

use App\Http\Resources\Admin\GrupoEmpresa\GrupoEmpresaResource;
use App\Http\Resources\Admin\GrupoEmpresa\GrupoEmpresaVisualizarResource;

use OpenApi\Attributes as OA;

class GrupoEmpresaController extends Controller
{
    public function __construct(
        protected GrupoEmpresaService $grupoEmpresaService,
    ) {}

    #[OA\Post(
        path: '/admin/grupos-empresas',
        summary: 'Admin — Cadastrar grupo empresa',
        description: 'Cria um grupo empresa (tenant) e, junto, o primeiro usuário administrador desse grupo empresa (que receberá e-mail de primeiro acesso).',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['nome', 'usuario'],
            properties: [
                new OA\Property(property: 'nome', type: 'string', maxLength: 255, description: 'Deve ser único entre os grupos empresa.'),
                new OA\Property(property: 'usuario', properties: [
                    new OA\Property(property: 'nome', type: 'string', maxLength: 255),
                    new OA\Property(property: 'email', type: 'string', format: 'email', maxLength: 255, description: 'Deve ser único entre os usuários.'),
                ], type: 'object'),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 201, description: 'Grupo empresa cadastrado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/GrupoEmpresa', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $this->authorize('admin.grupo_empresa.cadastrar');

        $grupoEmpresa = $this->grupoEmpresaService->cadastrar(GrupoEmpresaCadastroDTO::criarParaCadastro($request->validated()));

        return GrupoEmpresaResource::make($grupoEmpresa)->response()->setStatusCode(201);
    }

    #[OA\Put(
        path: '/admin/grupos-empresas/{id}',
        summary: 'Admin — Atualizar grupo empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['nome'],
            properties: [new OA\Property(property: 'nome', type: 'string', maxLength: 255)],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Grupo empresa atualizado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/GrupoEmpresa', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function atualizar(AtualizarRequest $request, string $id): JsonResponse
    {
        $this->authorize('admin.grupo_empresa.atualizar');

        $grupoEmpresa = $this->grupoEmpresaService->atualizar(
            GrupoEmpresaAtualizacaoDTO::criarParaAtualizacao(
                $id,
                $request->validated()
            )
        );

        return GrupoEmpresaResource::make($grupoEmpresa)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/grupos-empresas/{id}',
        summary: 'Admin — Visualizar grupo empresa',
        description: 'Retorna o grupo empresa com seus grupos de permissão internos (Private) e os usuários de cada um.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Grupo empresa encontrado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/GrupoEmpresaVisualizar', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('admin.grupo_empresa.visualizar');

        $grupoEmpresa = $this->grupoEmpresaService->visualizar($id);

        return GrupoEmpresaVisualizarResource::make($grupoEmpresa)->response()->setStatusCode(200);
    }

    #[OA\Delete(
        path: '/admin/grupos-empresas/{id}',
        summary: 'Admin — Excluir grupo empresa',
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
        $this->authorize('admin.grupo_empresa.excluir');

        $this->grupoEmpresaService->excluir($id);

        return response()->json(null, 204);
    }

    #[OA\Patch(
        path: '/admin/grupos-empresas/{id}/ativar',
        summary: 'Admin — Ativar/reativar grupo empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Grupo empresa ativado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/GrupoEmpresa', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function ativar(string $id): JsonResponse
    {
        $this->authorize('admin.grupo_empresa.ativar');

        $grupoEmpresa = $this->grupoEmpresaService->ativar($id);

        return GrupoEmpresaResource::make($grupoEmpresa)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/grupos-empresas',
        summary: 'Admin — Listar grupos empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'nome', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 255)),
            new OA\Parameter(name: 'excluido', in: 'query', schema: new OA\Schema(type: 'boolean')),
            new OA\Parameter(name: 'por_pagina', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 15)),
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista paginada de grupos empresa.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/GrupoEmpresa')),
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
        $this->authorize('admin.grupo_empresa.listar');

        $grupoEmpresas = $this->grupoEmpresaService->listar(GrupoEmpresaFiltroDTO::criarParaFiltro($request->validated()));

        return GrupoEmpresaResource::collection($grupoEmpresas)->response()->setStatusCode(200);
    }
}
