<?php

namespace App\Http\Controllers\Private;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\BannerService;

use App\Enums\EntidadeTipo as EntidadeTipoChave;

use App\Http\Resources\Private\Banner\BannerResource;

use OpenApi\Attributes as OA;

class BannerController extends Controller
{
    public function __construct(
        protected BannerService $bannerService,
    ) {}

    #[OA\Get(
        path: '/banners/disponiveis',
        summary: 'Private — Listar banners disponíveis',
        description: 'Retorna somente os banners elegíveis para o usuário autenticado NESTE momento: ativos, dentro do período da campanha e com direcionamento compatível (todos ou entidade Private). Único endpoint consultado no acesso ao Private — o backend é a fonte de verdade sobre elegibilidade, nada é filtrado no cliente.',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
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
        $banners = $this->bannerService->disponiveisPara(EntidadeTipoChave::PRIVATE);

        return BannerResource::collection($banners)->response()->setStatusCode(200);
    }
}
