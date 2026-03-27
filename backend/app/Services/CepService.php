<?php

namespace App\Services;


use App\Services\External\Cep\ViaCepService;
use App\Services\External\Cep\BrasilApiService;

use App\Contracts\Cep\CepProviderInterface;

use App\DTO\Lookup\CepConsultaDTO;
use App\DTO\Lookup\CepResultadoDTO;

use App\Enums\ErrorCode;
use App\Enums\EntidadeTipo;

use App\Exceptions\BusinessException;

class CepService {

    /**
     * @param CepProviderInterface[] $providers
     */
    public function __construct(
        private ViaCepService $viaCep,
        private BrasilApiService $brasilApi,
        private iterable $providers
    ) {}

    public function consultar(CepConsultaDTO $dto): CepResultadoDTO
    {
        foreach ($this->providers as $provider) {

            $resultado = $provider->consultar($dto->cep);

            if ($resultado->encontrado) {
                return $resultado;
            }
        }

        throw new BusinessException('CEP não encontrado');
    }
}
