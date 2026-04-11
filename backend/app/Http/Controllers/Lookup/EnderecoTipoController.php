<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Enums\EmpresaEnderecoTipo;


class EnderecoTipoController extends Controller
{
    public function listar(): JsonResponse
    {
        return response()->json(EmpresaEnderecoTipo::lookup());
    }
}
