<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Enums\EmpresaContatoTipo;

use App\Http\Resources\Lookup\ContatoTipo\ContatoTipoResource;

class ContatoTipoController extends Controller
{
    public function listar(): JsonResponse
    {
        return ContatoTipoResource::collection(EmpresaContatoTipo::lookup())->response()->setStatusCode(200);
    }
}
