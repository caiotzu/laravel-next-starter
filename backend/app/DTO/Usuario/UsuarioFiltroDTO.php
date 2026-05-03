<?php

namespace App\DTO\Usuario;

use App\DTO\Common\PaginationDTO;

final class UsuarioFiltroDTO
{
    private function __construct(
        public readonly PaginationDTO $paginacao,
        public readonly ?string $id = null,
        public readonly ?string $nome = null,
        public readonly ?string $grupo_id = null,
        public readonly ?bool $excluido = null,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            paginacao: PaginationDTO::criarParaPaginar($dados),
            id: $dados['id'] ?? null,
            nome: $dados['nome'] ?? null,
            grupo_id: $dados['grupo_id'] ?? null,
            excluido: $dados['excluido'] ?? null,
        );
    }
}
