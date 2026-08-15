<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\EmpresaService;

use App\Http\Requests\Admin\Empresa\ListarRequest;
use App\Http\Requests\Admin\Empresa\CadastrarRequest;
use App\Http\Requests\Admin\Empresa\AtualizarRequest;

use App\DTO\Empresa\EmpresaFiltroDTO;
use App\DTO\Empresa\EmpresaCadastroDTO;
use App\DTO\Empresa\EmpresaAtualizacaoDTO;

use App\Http\Resources\Admin\Empresa\EmpresaResource;
use App\Http\Resources\Admin\Empresa\EmpresaListarResource;
use App\Http\Resources\Admin\Empresa\EmpresaVisualizarResource;

use App\Enums\EntidadeTipo;

use OpenApi\Attributes as OA;

class EmpresaController extends Controller
{
    public function __construct(
        protected EmpresaService $empresaService,
    ) {}

    #[OA\Post(
        path: '/admin/empresas',
        summary: 'Admin — Cadastrar empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['grupo_empresa_id', 'cnpj', 'nome_fantasia', 'razao_social', 'uf'],
            properties: [
                new OA\Property(property: 'grupo_empresa_id', type: 'string', format: 'uuid'),
                new OA\Property(property: 'matriz_id', type: 'string', format: 'uuid', nullable: true),
                new OA\Property(property: 'cnpj', type: 'string', example: '12345678000190'),
                new OA\Property(property: 'nome_fantasia', type: 'string', maxLength: 60),
                new OA\Property(property: 'razao_social', type: 'string', maxLength: 60),
                new OA\Property(property: 'inscricao_estadual', type: 'string', nullable: true),
                new OA\Property(property: 'inscricao_municipal', type: 'string', nullable: true),
                new OA\Property(property: 'uf', type: 'string', example: 'SP'),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 201, description: 'Empresa cadastrada.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Empresa', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $this->authorize('admin.empresa.cadastrar');

        $empresa = $this->empresaService->cadastrar(EmpresaCadastroDTO::criarParaCadastro($request->validated()));

        return EmpresaResource::make($empresa)->response()->setStatusCode(201);
    }

    #[OA\Put(
        path: '/admin/empresas/{id}',
        summary: 'Admin — Atualizar empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['matriz_id', 'nome_fantasia', 'razao_social', 'uf'],
            properties: [
                new OA\Property(property: 'matriz_id', type: 'string', format: 'uuid', nullable: true),
                new OA\Property(property: 'nome_fantasia', type: 'string', maxLength: 60),
                new OA\Property(property: 'razao_social', type: 'string', maxLength: 60),
                new OA\Property(property: 'inscricao_estadual', type: 'string', nullable: true),
                new OA\Property(property: 'inscricao_municipal', type: 'string', nullable: true),
                new OA\Property(property: 'uf', type: 'string', example: 'SP'),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Empresa atualizada.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Empresa', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function atualizar(AtualizarRequest $request, string $id): JsonResponse
    {
        $this->authorize('admin.empresa.atualizar');

        $empresa = $this->empresaService->atualizar(
            EmpresaAtualizacaoDTO::criarParaAtualizacao(
                $id,
                $request->validated()
            ),
            EntidadeTipo::ADMIN
        );

        return EmpresaResource::make($empresa)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/empresas/{id}',
        summary: 'Admin — Visualizar empresa',
        description: 'Retorna os dados da empresa, incluindo grupo empresa, contatos e endereços.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Empresa encontrada.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/EmpresaVisualizar', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('admin.empresa.visualizar');

        $empresa = $this->empresaService->visualizar($id, EntidadeTipo::ADMIN);

        return EmpresaVisualizarResource::make($empresa)->response()->setStatusCode(200);
    }

    #[OA\Delete(
        path: '/admin/empresas/{id}',
        summary: 'Admin — Excluir empresa',
        description: 'Exclusão lógica (soft delete) da empresa.',
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
        $this->authorize('admin.empresa.excluir');

        $this->empresaService->excluir($id);

        return response()->json(null, 204);
    }

    #[OA\Patch(
        path: '/admin/empresas/{id}/ativar',
        summary: 'Admin — Ativar/reativar empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Empresa ativada.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Empresa', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function ativar(string $id): JsonResponse
    {
        $this->authorize('admin.empresa.ativar');

        $empresa = $this->empresaService->ativar($id);

        return EmpresaResource::make($empresa)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/empresas',
        summary: 'Admin — Listar empresas',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'grupo_empresa_id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'matriz_id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'cnpj', in: 'query', schema: new OA\Schema(type: 'string', minLength: 14, maxLength: 14)),
            new OA\Parameter(name: 'nome_fantasia', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 60)),
            new OA\Parameter(name: 'razao_social', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 60)),
            new OA\Parameter(name: 'inscricao_estadual', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'inscricao_municipal', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'uf', in: 'query', schema: new OA\Schema(type: 'string', minLength: 2, maxLength: 2)),
            new OA\Parameter(name: 'excluido', description: 'Inclui/filtra empresas excluídas (soft deleted).', in: 'query', schema: new OA\Schema(type: 'boolean')),
            new OA\Parameter(name: 'por_pagina', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 15)),
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista paginada de empresas.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/EmpresaListarItem')),
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
        $this->authorize('admin.empresa.listar');

        $empresas = $this->empresaService->listar(
            EmpresaFiltroDTO::criarParaFiltro($request->validated()),
            EntidadeTipo::ADMIN
        );

        return EmpresaListarResource::collection($empresas)->response()->setStatusCode(200);
    }
}
