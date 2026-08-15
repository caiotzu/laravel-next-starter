<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\EmpresaContatoService;

use App\Http\Requests\Admin\EmpresaContato\CadastrarRequest;
use App\Http\Requests\Admin\EmpresaContato\AtualizarRequest;

use App\DTO\EmpresaContato\EmpresaContatoFiltroDTO;
use App\DTO\EmpresaContato\EmpresaContatoCadastroDTO;
use App\DTO\EmpresaContato\EmpresaContatoAtualizacaoDTO;

use App\Http\Resources\Admin\EmpresaContato\EmpresaContatoResource;

use App\Enums\EntidadeTipo;

use OpenApi\Attributes as OA;

class EmpresaContatoController extends Controller
{
    public function __construct(
        protected EmpresaContatoService $empresaContatoService,
    ) {}

    #[OA\Post(
        path: '/admin/empresas/{empresaId}/contatos',
        summary: 'Admin — Cadastrar contato da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'empresaId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['tipo', 'valor', 'principal', 'ativo'],
            properties: [
                new OA\Property(property: 'tipo', type: 'string', enum: ['T', 'E'], description: 'T = Telefone, E = E-mail'),
                new OA\Property(property: 'valor', type: 'string', maxLength: 100),
                new OA\Property(property: 'principal', type: 'boolean', description: 'Só pode existir um contato principal por tipo em cada empresa.'),
                new OA\Property(property: 'ativo', type: 'boolean'),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 201, description: 'Contato cadastrado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/EmpresaContato', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function cadastrar(CadastrarRequest $request, string $empresaId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.cadastrar');

        $contato = $this->empresaContatoService->cadastrar(
            EmpresaContatoCadastroDTO::criarParaCadastro(
                $empresaId,
                dados: $request->validated()
            ),
            EntidadeTipo::ADMIN
        );

        return EmpresaContatoResource::make($contato)->response()->setStatusCode(201);
    }

    #[OA\Put(
        path: '/admin/empresas/{empresaId}/contatos/{contatoId}',
        summary: 'Admin — Atualizar contato da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'empresaId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'contatoId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['tipo', 'valor', 'principal', 'ativo'],
            properties: [
                new OA\Property(property: 'tipo', type: 'string', enum: ['T', 'E']),
                new OA\Property(property: 'valor', type: 'string', maxLength: 100),
                new OA\Property(property: 'principal', type: 'boolean'),
                new OA\Property(property: 'ativo', type: 'boolean'),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Contato atualizado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/EmpresaContato', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function atualizar(AtualizarRequest $request, string $empresaId, string $contatoId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.atualizar');

        $contato = $this->empresaContatoService->atualizar(
            EmpresaContatoAtualizacaoDTO::criarParaAtualizacao(
                $empresaId,
                $contatoId,
                $request->validated()
            ),
            EntidadeTipo::ADMIN
        );

        return EmpresaContatoResource::make($contato)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/empresas/{empresaId}/contatos/{contatoId}',
        summary: 'Admin — Visualizar contato da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'empresaId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'contatoId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Contato encontrado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/EmpresaContato', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function visualizar(string $empresaId, string $contatoId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.visualizar');

        $contato = $this->empresaContatoService->visualizar($empresaId, $contatoId, EntidadeTipo::ADMIN);

        return EmpresaContatoResource::make($contato)->response()->setStatusCode(200);
    }

    #[OA\Delete(
        path: '/admin/empresas/{empresaId}/contatos/{contatoId}',
        summary: 'Admin — Excluir contato da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'empresaId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'contatoId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 204, ref: '#/components/responses/NoContent'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function excluir(string $empresaId, string $contatoId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.excluir');

        $this->empresaContatoService->excluir($empresaId, $contatoId, EntidadeTipo::ADMIN);

        return response()->json(null, 204);
    }

    #[OA\Patch(
        path: '/admin/empresas/{empresaId}/contatos/{contatoId}/ativar',
        summary: 'Admin — Ativar/reativar contato da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'empresaId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'contatoId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Contato ativado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/EmpresaContato', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function ativar(string $empresaId, string $contatoId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.ativar');

        $contato = $this->empresaContatoService->ativar($empresaId, $contatoId, EntidadeTipo::ADMIN);

        return EmpresaContatoResource::make($contato)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/empresas/{empresaId}/contatos',
        summary: 'Admin — Listar contatos da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'empresaId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Lista de contatos.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/EmpresaContato')),
            ], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function listar(string $empresaId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.listar');

        $contatos = $this->empresaContatoService->listar(EmpresaContatoFiltroDTO::criarParaFiltro([
                'empresa_id' => $empresaId
            ]),
            EntidadeTipo::ADMIN
        );

        return EmpresaContatoResource::collection($contatos)->response()->setStatusCode(200);
    }
}
