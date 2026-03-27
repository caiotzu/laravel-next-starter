<?php

namespace App\DTO\Lookup;

final class CepConsultaDTO
{
    public function __construct(
        public readonly string $cep,
    ) {}
}
