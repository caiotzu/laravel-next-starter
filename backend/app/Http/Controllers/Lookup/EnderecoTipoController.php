<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Enums\EmpresaEnderecoTipo;

use App\Http\Resources\Lookup\EnderecoTipo\EnderecoTipoResource;

use OpenApi\Attributes as OA;

class EnderecoTipoController extends Controller
{
    #[OA\Get(
        path: '/lookup/enderecos-tipos',
        summary: 'Lookup — Listar tipos de endereço',
        description: 'Lista os tipos de endereço de empresa suportados pelo sistema (enum App\\Enums\\EmpresaEnderecoTipo), para uso em selects de formulário.',
        security: [['bearerAuth' => []]],
        tags: ['Lookup'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de tipos de endereço.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(properties: [
                                new OA\Property(property: 'valor', type: 'string', enum: ['COMERCIAL', 'FISCAL', 'CORRESPONDENCIA', 'COBRANCA', 'ENTREGA'], example: 'COMERCIAL'),
                                new OA\Property(property: 'descricao', type: 'string', example: 'Comercial'),
                            ], type: 'object')
                        ),
                    ],
                    type: 'object'
                )
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 500, ref: '#/components/responses/ServerError'),
        ]
    )]
    public function listar(): JsonResponse
    {
        return EnderecoTipoResource::collection(EmpresaEnderecoTipo::lookup())->response()->setStatusCode(200);
    }
}
