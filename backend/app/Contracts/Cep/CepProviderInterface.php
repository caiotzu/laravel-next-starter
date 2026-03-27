<?php

namespace App\Contracts\Cep;

use App\DTO\Lookup\CepResultadoDTO;

interface CepProviderInterface
{
    public function consultar(string $cep): CepResultadoDTO;
}
