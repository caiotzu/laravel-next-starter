<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\CepService;

use App\DTO\Lookup\Cep\CepConsultaDTO;

use App\Http\Requests\Lookup\Cep\ConsultarRequest;

use App\Http\Resources\Lookup\Cep\CepResource;

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

        return CepResource::make($cep)->response()->setStatusCode(200);
    }
}
