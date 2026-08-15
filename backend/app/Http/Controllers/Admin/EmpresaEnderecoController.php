<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\EmpresaEnderecoService;

use App\Http\Requests\Admin\EmpresaEndereco\CadastrarRequest;
use App\Http\Requests\Admin\EmpresaEndereco\AtualizarRequest;

use App\DTO\EmpresaEndereco\EmpresaEnderecoFiltroDTO;
use App\DTO\EmpresaEndereco\EmpresaEnderecoCadastroDTO;
use App\DTO\EmpresaEndereco\EmpresaEnderecoAtualizacaoDTO;

use App\Http\Resources\Admin\EmpresaEndereco\EmpresaEnderecoResource;

use App\Enums\EntidadeTipo;

use OpenApi\Attributes as OA;

class EmpresaEnderecoController extends Controller
{
    public function __construct(
        protected EmpresaEnderecoService $empresaEnderecoService,
    ) {}

    #[OA\Post(
        path: '/admin/empresas/{empresaId}/enderecos',
        summary: 'Admin — Cadastrar endereço da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'empresaId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(required: ['tipo', 'municipio_id', 'principal', 'ativo', 'cep', 'logradouro', 'numero', 'bairro'],
            properties: [
                new OA\Property(property: 'tipo', type: 'string', enum: ['COMERCIAL', 'FISCAL', 'CORRESPONDENCIA', 'COBRANCA', 'ENTREGA']),
                new OA\Property(property: 'municipio_id', type: 'string', format: 'uuid'),
                new OA\Property(property: 'principal', type: 'boolean', description: 'Só pode existir um endereço principal por empresa.'),
                new OA\Property(property: 'ativo', type: 'boolean'),
                new OA\Property(property: 'cep', type: 'string', pattern: '^[0-9]{8}$', description: 'Somente dígitos (a máscara é removida automaticamente).', example: '01310100'),
                new OA\Property(property: 'logradouro', type: 'string', maxLength: 100),
                new OA\Property(property: 'numero', type: 'string', maxLength: 5),
                new OA\Property(property: 'bairro', type: 'string', maxLength: 100),
                new OA\Property(property: 'complemento', type: 'string', nullable: true, maxLength: 50),
            ],
            type: 'object')),
        responses: [
            new OA\Response(response: 201, description: 'Endereço cadastrado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/EmpresaEndereco', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function cadastrar(CadastrarRequest $request, string $empresaId): JsonResponse
    {
        $this->authorize('admin.empresa.endereco.cadastrar');

        $endereco = $this->empresaEnderecoService->cadastrar(
            EmpresaEnderecoCadastroDTO::criarParaCadastro(
                $empresaId,
                dados: $request->validated()
            ),
            EntidadeTipo::ADMIN
        );

        return EmpresaEnderecoResource::make($endereco)->response()->setStatusCode(201);
    }

    #[OA\Put(
        path: '/admin/empresas/{empresaId}/enderecos/{enderecoId}',
        summary: 'Admin — Atualizar endereço da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'empresaId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'enderecoId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(required: ['tipo', 'municipio_id', 'principal', 'ativo', 'cep', 'logradouro', 'numero', 'bairro'],
            properties: [
                new OA\Property(property: 'tipo', type: 'string', enum: ['COMERCIAL', 'FISCAL', 'CORRESPONDENCIA', 'COBRANCA', 'ENTREGA']),
                new OA\Property(property: 'municipio_id', type: 'string', format: 'uuid'),
                new OA\Property(property: 'principal', type: 'boolean', description: 'Só pode existir um endereço principal por empresa.'),
                new OA\Property(property: 'ativo', type: 'boolean'),
                new OA\Property(property: 'cep', type: 'string', pattern: '^[0-9]{8}$', description: 'Somente dígitos (a máscara é removida automaticamente).', example: '01310100'),
                new OA\Property(property: 'logradouro', type: 'string', maxLength: 100),
                new OA\Property(property: 'numero', type: 'string', maxLength: 5),
                new OA\Property(property: 'bairro', type: 'string', maxLength: 100),
                new OA\Property(property: 'complemento', type: 'string', nullable: true, maxLength: 50),
            ],
            type: 'object')),
        responses: [
            new OA\Response(response: 200, description: 'Endereço atualizado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/EmpresaEndereco', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function atualizar(AtualizarRequest $request, string $empresaId, string $enderecoId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.atualizar');

        $endereco = $this->empresaEnderecoService->atualizar(
            EmpresaEnderecoAtualizacaoDTO::criarParaAtualizacao(
                $empresaId,
                $enderecoId,
                $request->validated()
            ),
            EntidadeTipo::ADMIN
        );

        return EmpresaEnderecoResource::make($endereco)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/empresas/{empresaId}/enderecos/{enderecoId}',
        summary: 'Admin — Visualizar endereço da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'empresaId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'enderecoId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Endereço encontrado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/EmpresaEndereco', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function visualizar(string $empresaId, string $enderecoId): JsonResponse
    {
        $this->authorize('admin.empresa.endereco.visualizar');

        $endereco = $this->empresaEnderecoService->visualizar($empresaId, $enderecoId, EntidadeTipo::ADMIN);

        return EmpresaEnderecoResource::make($endereco)->response()->setStatusCode(200);
    }

    #[OA\Delete(
        path: '/admin/empresas/{empresaId}/enderecos/{enderecoId}',
        summary: 'Admin — Excluir endereço da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'empresaId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'enderecoId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 204, ref: '#/components/responses/NoContent'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function excluir(string $empresaId, string $enderecoId): JsonResponse
    {
        $this->authorize('admin.empresa.endereco.excluir');

        $this->empresaEnderecoService->excluir($empresaId, $enderecoId, EntidadeTipo::ADMIN);

        return response()->json(null, 204);
    }

    #[OA\Patch(
        path: '/admin/empresas/{empresaId}/enderecos/{enderecoId}/ativar',
        summary: 'Admin — Ativar/reativar endereço da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'empresaId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'enderecoId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Endereço ativado.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/EmpresaEndereco', type: 'object')], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function ativar(string $empresaId, string $enderecoId): JsonResponse
    {
        $this->authorize('admin.empresa.endereco.ativar');

        $endereco = $this->empresaEnderecoService->ativar($empresaId, $enderecoId, EntidadeTipo::ADMIN);

        return EmpresaEnderecoResource::make($endereco)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/empresas/{empresaId}/enderecos',
        summary: 'Admin — Listar endereços da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        parameters: [new OA\Parameter(name: 'empresaId', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Lista de endereços.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/EmpresaEndereco')),
            ], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function listar(string $empresaId): JsonResponse
    {
        $this->authorize('admin.empresa.endereco.listar');

        $enderecos = $this->empresaEnderecoService->listar(EmpresaEnderecoFiltroDTO::criarParaFiltro([
                'empresa_id' => $empresaId
            ]),
            EntidadeTipo::ADMIN
        );

        return EmpresaEnderecoResource::collection($enderecos)->response()->setStatusCode(200);
    }
}
