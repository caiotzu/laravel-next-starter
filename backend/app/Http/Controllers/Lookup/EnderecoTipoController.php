<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Enums\EmpresaEnderecoTipo;

use App\Http\Resources\Lookup\EnderecoTipo\EnderecoTipoResource;

class EnderecoTipoController extends Controller
{
    public function listar(): JsonResponse
    {
        return EnderecoTipoResource::collection(EmpresaEnderecoTipo::lookup())->response()->setStatusCode(200);
    }
}
