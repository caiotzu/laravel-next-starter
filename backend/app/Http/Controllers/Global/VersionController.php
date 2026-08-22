<?php

namespace App\Http\Controllers\Global;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use OpenApi\Attributes as OA;

/**
 * Versão de build da plataforma (não confundir com a versão exibida em uma
 * Release individual, ver ReleaseService::versaoAtual) — vem de
 * config('app.platform_version'), lida de APP_VERSION no ambiente. Não
 * executa nenhum comando Git em tempo de requisição.
 */
class VersionController extends Controller
{
    #[OA\Get(
        path: '/version',
        summary: 'Global — Versão atual da plataforma',
        description: 'Retorna a versão de build da plataforma. Não requer autenticação, para poder ser exibida também em telas de login.',
        tags: ['Global'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Versão atual.',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'data', properties: [
                        new OA\Property(property: 'version', type: 'string', example: '1.0.0'),
                    ], type: 'object'),
                ], type: 'object')
            ),
        ]
    )]
    public function obter(): JsonResponse
    {
        return response()->json([
            'data' => [
                'version' => config('app.platform_version'),
            ],
        ]);
    }
}
