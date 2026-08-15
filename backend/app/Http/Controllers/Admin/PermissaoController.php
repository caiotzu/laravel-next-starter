<?php

namespace App\Http\Controllers\Admin;


use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\PermissaoService;

use App\Http\Resources\Admin\Permissao\PermissaoResource;

use App\Enums\PermissaoTipo;

use OpenApi\Attributes as OA;

class PermissaoController extends Controller
{
    public function __construct(
        protected PermissaoService $permissaoService,
    ) {}

    #[OA\Get(
        path: '/admin/permissoes',
        summary: 'Admin — Listar permissões disponíveis',
        description: 'Lista todas as permissões cadastradas com prefixo "admin." (não paginado), usadas para compor grupos.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        responses: [
            new OA\Response(response: 200, description: 'Lista de permissões.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Permissao')),
            ], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
        ]
    )]
    public function listar(): JsonResponse
    {
        $grupos = $this->permissaoService->listar(PermissaoTipo::ADMIN);

        return PermissaoResource::collection($grupos)->response()->setStatusCode(200);
    }
}
