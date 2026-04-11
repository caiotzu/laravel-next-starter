<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Enums\EmpresaContatoTipo;


class ContatoTipoController extends Controller
{
    public function listar(): JsonResponse
    {
        return response()->json(EmpresaContatoTipo::lookup());
    }
}
