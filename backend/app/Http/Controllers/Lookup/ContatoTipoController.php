<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Enums\EmpresaContatoTipo;

use App\Http\Resources\Lookup\ContatoTipo\ContatoTipoResource;

use OpenApi\Attributes as OA;

class ContatoTipoController extends Controller
{
    #[OA\Get(
        path: '/lookup/contatos-tipos',
        summary: 'Lookup — Listar tipos de contato',
        description: 'Lista os tipos de contato de empresa suportados pelo sistema (enum App\\Enums\\EmpresaContatoTipo), para uso em selects de formulário.',
        security: [['bearerAuth' => []]],
        tags: ['Lookup'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de tipos de contato.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(properties: [
                                new OA\Property(property: 'valor', type: 'string', enum: ['T', 'E'], example: 'T'),
                                new OA\Property(property: 'descricao', type: 'string', example: 'Telefone'),
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
        return ContatoTipoResource::collection(EmpresaContatoTipo::lookup())->response()->setStatusCode(200);
    }
}
