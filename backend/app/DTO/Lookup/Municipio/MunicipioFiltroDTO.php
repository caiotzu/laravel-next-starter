<?php

namespace App\DTO\Lookup\Municipio;

use App\DTO\Common\PaginationDTO;

final class MunicipioFiltroDTO
{
    private function __construct(
        public readonly PaginationDTO $paginacao,
        public readonly ?string $nome = null,
        public readonly ?string $uf = null,
        public readonly ?string $codigo_ibge = null,
        public readonly ?string $codigo_siafi = null,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            paginacao: PaginationDTO::criarParaPaginar($dados),
            nome: $dados['nome'] ?? null,
            uf: $dados['uf'] ?? null,
            codigo_ibge: $dados['codigo_ibge'] ?? null,
            codigo_siafi: $dados['codigo_siafi'] ?? null
        );
    }
}
