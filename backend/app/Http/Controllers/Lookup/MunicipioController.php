<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\MunicipioService;

use App\DTO\Lookup\Municipio\MunicipioFiltroDTO;

use App\Http\Requests\Lookup\Municipio\ListarRequest;

use App\Http\Resources\Lookup\Municipio\MunicipioResource;

class MunicipioController extends Controller
{
    public function __construct(
        protected MunicipioService $municipioService
    ) {}

    public function listar(ListarRequest $request): JsonResponse
    {
        $municipios = $this->municipioService->listar(MunicipioFiltroDTO::criarParaFiltro($request->validated()));

        return MunicipioResource::collection($municipios)->response()->setStatusCode(200);
    }
}
