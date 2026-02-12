<?php

namespace App\DTO\Common;

final class PaginationDTO
{
    private function __construct(
        public readonly int $por_pagina,
    ) {}

    public static function criarParaPaginar(array $dados): self
    {
        $default = config('api.pagination.default');
        $max     = config('api.pagination.max');
        $min     = config('api.pagination.min');

        $por_pagina = (int) ($dados['por_pagina'] ?? $default);

        return new self(
            por_pagina: min(max($por_pagina, $min), $max)
        );
    }
}
