<?php

namespace App\DTO\Grupo;

use App\DTO\Common\PaginationDTO;

final class GrupoFiltroDTO
{
    private function __construct(
        public readonly PaginationDTO $paginacao,
        public readonly ?string $id = null,
        public readonly ?string $descricao = null,
        public readonly ?bool $excluido = null
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            paginacao: PaginationDTO::criarParaPaginar($dados),
            id: $dados['id'] ?? null,
            descricao: $dados['descricao'] ?? null,
            excluido: $dados['excluido'] ?? null
        );
    }
}
