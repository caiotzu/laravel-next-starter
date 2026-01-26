<?php

namespace App\DTO\Common;

final class PaginationDTO
{
    public function __construct(
        public readonly int $porPagina,
    ) {}

    public static function criarParaPaginar(array $dados): self
    {
        $default = config('api.pagination.default');
        $max     = config('api.pagination.max');
        $min     = config('api.pagination.min');

        $porPagina = (int) ($dados['porPagina'] ?? $default);

        return new self(
            porPagina: min(max($porPagina, $min), $max)
        );
    }
}
