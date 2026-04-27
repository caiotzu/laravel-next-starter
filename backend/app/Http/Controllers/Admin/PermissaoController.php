<?php

namespace App\Http\Controllers\Admin;


use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\PermissaoService;

use App\Http\Resources\Admin\Permissao\PermissaoResource;

use App\Enums\PermissaoTipo;

class PermissaoController extends Controller
{
    public function __construct(
        protected PermissaoService $permissaoService,
    ) {}

    public function listar(): JsonResponse
    {
        $grupos = $this->permissaoService->listar(PermissaoTipo::ADMIN);

        return PermissaoResource::collection($grupos)->response()->setStatusCode(200);
    }
}
