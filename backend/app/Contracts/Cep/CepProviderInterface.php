<?php

namespace App\Contracts\Cep;

use App\DTO\Lookup\Cep\CepResultadoDTO;

interface CepProviderInterface
{
    public function consultar(string $cep): CepResultadoDTO;
}
