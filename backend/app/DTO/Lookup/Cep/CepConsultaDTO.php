<?php

namespace App\DTO\Lookup\Cep;

final class CepConsultaDTO
{
    public function __construct(
        public readonly string $cep,
    ) {}
}
