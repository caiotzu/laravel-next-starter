<?php

namespace App\Http\Controllers\Private;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\EmpresaEnderecoService;

use App\Http\Requests\Private\EmpresaEndereco\CadastrarRequest;
use App\Http\Requests\Private\EmpresaEndereco\AtualizarRequest;

use App\DTO\EmpresaEndereco\EmpresaEnderecoFiltroDTO;
use App\DTO\EmpresaEndereco\EmpresaEnderecoCadastroDTO;
use App\DTO\EmpresaEndereco\EmpresaEnderecoAtualizacaoDTO;

use App\Http\Resources\Private\EmpresaEndereco\EmpresaEnderecoResource;

use App\Enums\EntidadeTipo;

use OpenApi\Attributes as OA;

class EmpresaEnderecoController extends Controller
{
    public function __construct(
        protected EmpresaEnderecoService $empresaEnderecoService,
    ) {}

    #[OA\Post(
        path: '/empresas/{empresaId}/enderecos',
        summary: 'Private — Cadastrar endereço da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
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
        $this->authorize('private.empresa.endereco.cadastrar');

        $endereco = $this->empresaEnderecoService->cadastrar(
            EmpresaEnderecoCadastroDTO::criarParaCadastro(
                $empresaId,
                dados: $request->validated()
            ),
            EntidadeTipo::PRIVATE
        );

        return EmpresaEnderecoResource::make($endereco)->response()->setStatusCode(201);
    }

    #[OA\Put(
        path: '/empresas/{empresaId}/enderecos/{enderecoId}',
        summary: 'Private — Atualizar endereço da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
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
        $this->authorize('private.empresa.contato.atualizar');

        $endereco = $this->empresaEnderecoService->atualizar(
            EmpresaEnderecoAtualizacaoDTO::criarParaAtualizacao(
                $empresaId,
                $enderecoId,
                $request->validated()
            ),
            EntidadeTipo::PRIVATE
        );

        return EmpresaEnderecoResource::make($endereco)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/empresas/{empresaId}/enderecos/{enderecoId}',
        summary: 'Private — Visualizar endereço da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
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
        $this->authorize('private.empresa.endereco.visualizar');

        $endereco = $this->empresaEnderecoService->visualizar($empresaId, $enderecoId, EntidadeTipo::PRIVATE);

        return EmpresaEnderecoResource::make($endereco)->response()->setStatusCode(200);
    }

    #[OA\Delete(
        path: '/empresas/{empresaId}/enderecos/{enderecoId}',
        summary: 'Private — Excluir endereço da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
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
        $this->authorize('private.empresa.endereco.excluir');

        $this->empresaEnderecoService->excluir($empresaId, $enderecoId, EntidadeTipo::PRIVATE);

        return response()->json(null, 204);
    }

    #[OA\Patch(
        path: '/empresas/{empresaId}/enderecos/{enderecoId}/ativar',
        summary: 'Private — Ativar/reativar endereço da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
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
        $this->authorize('private.empresa.endereco.ativar');

        $endereco = $this->empresaEnderecoService->ativar($empresaId, $enderecoId, EntidadeTipo::PRIVATE);

        return EmpresaEnderecoResource::make($endereco)->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/empresas/{empresaId}/enderecos',
        summary: 'Private — Listar endereços da empresa',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
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
        $this->authorize('private.empresa.endereco.listar');

        $enderecos = $this->empresaEnderecoService->listar(EmpresaEnderecoFiltroDTO::criarParaFiltro([
                'empresa_id' => $empresaId
            ]),
            EntidadeTipo::PRIVATE
        );

        return EmpresaEnderecoResource::collection($enderecos)->response()->setStatusCode(200);
    }
}
