<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\CepService;

use App\DTO\Lookup\Cep\CepConsultaDTO;

use App\Http\Requests\Lookup\Cep\ConsultarRequest;

use App\Http\Resources\Lookup\Cep\CepResource;

use OpenApi\Attributes as OA;

class CepController extends Controller
{
    public function __construct(
        protected CepService $cepService
    ) {}

    #[OA\Get(
        path: '/lookup/ceps/{cep}',
        summary: 'Lookup — Consultar CEP',
        description: 'Consulta um CEP em provedores externos configurados (o primeiro provedor que encontrar o CEP responde). Os dígitos não numéricos são removidos automaticamente antes da consulta.',
        security: [['bearerAuth' => []]],
        tags: ['Lookup'],
        parameters: [
            new OA\Parameter(
                name: 'cep',
                description: 'CEP a ser consultado, com ou sem máscara (ex.: 01310-100 ou 01310100).',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', example: '01310-100')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'CEP encontrado.',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', properties: [
                            new OA\Property(property: 'cep', type: 'string', example: '01310100'),
                            new OA\Property(property: 'logradouro', type: 'string', example: 'Avenida Paulista'),
                            new OA\Property(property: 'bairro', type: 'string', example: 'Bela Vista'),
                            new OA\Property(property: 'cidade', type: 'string', example: 'São Paulo'),
                            new OA\Property(property: 'uf', type: 'string', example: 'SP'),
                            new OA\Property(property: 'ibge', type: 'string', nullable: true, example: '3550308'),
                            new OA\Property(property: 'siafi', type: 'string', nullable: true, example: '7107'),
                            new OA\Property(property: 'encontrado', type: 'boolean', example: true),
                            new OA\Property(property: 'provider', type: 'string', example: 'viacep'),
                        ], type: 'object'),
                    ],
                    type: 'object'
                )
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
            new OA\Response(response: 400, ref: '#/components/responses/BusinessError'),
            new OA\Response(response: 500, ref: '#/components/responses/ServerError'),
        ]
    )]
    public function consultar(ConsultarRequest $request): JsonResponse
    {
        $cep = $this->cepService->consultar(
            new CepConsultaDTO($request->cep)
        );

        return CepResource::make($cep)->response()->setStatusCode(200);
    }
}
