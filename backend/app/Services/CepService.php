<?php

namespace App\Services;

use App\Contracts\Cep\CepProviderInterface;

use App\DTO\Lookup\Cep\CepConsultaDTO;
use App\DTO\Lookup\Cep\CepResultadoDTO;

use App\Exceptions\BusinessException;

class CepService {

    /**
     * @param CepProviderInterface[] $providers
     */
    public function __construct(
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
