<?php

namespace App\DTO\GrupoEmpresa;

use App\DTO\Common\PaginationDTO;

final class GrupoEmpresaFiltroDTO
{
    private function __construct(
        public readonly ?string $id = null,
        public readonly ?string $nome = null,
        public readonly ?bool $excluido = null,
        public readonly PaginationDTO $paginacao
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            id: $dados['id'] ?? null,
            nome: $dados['nome'] ?? null,
            excluido: $dados['excluido'] ?? null,
            paginacao: PaginationDTO::criarParaPaginar($dados),
        );
    }
}
