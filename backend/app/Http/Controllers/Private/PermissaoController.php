<?php

namespace App\Http\Controllers\Private;


use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\PermissaoService;

use App\Http\Resources\Private\Permissao\PermissaoResource;

use App\Enums\PermissaoTipo;

use OpenApi\Attributes as OA;

class PermissaoController extends Controller
{
    public function __construct(
        protected PermissaoService $permissaoService,
    ) {}

    #[OA\Get(
        path: '/permissoes',
        summary: 'Private — Listar permissões disponíveis',
        description: 'Lista todas as permissões cadastradas com prefixo "private." (não paginado), usadas para compor grupos.',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        responses: [
            new OA\Response(response: 200, description: 'Lista de permissões.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Permissao')),
            ], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
        ]
    )]
    public function listar(): JsonResponse
    {
        $grupos = $this->permissaoService->listar(PermissaoTipo::PRIVATE);

        return PermissaoResource::collection($grupos)->response()->setStatusCode(200);
    }
}
