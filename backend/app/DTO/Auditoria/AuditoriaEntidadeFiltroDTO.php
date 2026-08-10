<?php

namespace App\DTO\Auditoria;

use App\DTO\Common\PaginationDTO;

final class AuditoriaEntidadeFiltroDTO
{
    private function __construct(
        public readonly PaginationDTO $paginacao,
        public readonly ?string $busca = null,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            paginacao: PaginationDTO::criarParaPaginar($dados),
            busca: $dados['busca'] ?? null,
        );
    }
}
