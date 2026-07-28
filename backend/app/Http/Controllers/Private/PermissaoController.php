<?php

namespace App\Http\Controllers\Private;


use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\PermissaoService;

use App\Http\Resources\Private\Permissao\PermissaoResource;

use App\Enums\PermissaoTipo;

class PermissaoController extends Controller
{
    public function __construct(
        protected PermissaoService $permissaoService,
    ) {}

    public function listar(): JsonResponse
    {
        $grupos = $this->permissaoService->listar(PermissaoTipo::PRIVATE);

        return PermissaoResource::collection($grupos)->response()->setStatusCode(200);
    }
}
