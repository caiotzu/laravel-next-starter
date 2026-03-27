<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\CepService;

use App\DTO\Lookup\CepConsultaDTO;

use App\Http\Requests\Lookup\Cep\ConsultarRequest;

class CepController extends Controller
{
    public function __construct(
        protected CepService $cepService
    ) {}

    public function consultar(ConsultarRequest $request): JsonResponse
    {
        $cep = $this->cepService->consultar(
            new CepConsultaDTO($request->cep)
        );

        return response()->json([
            'message' => 'Consulta do CEP realizada com sucesso.',
            'data' => $cep,
        ]);
    }
}
