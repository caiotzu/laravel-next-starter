<?php

namespace App\DTO;

use App\DTO\Common\PaginationDTO;

final class GrupoEmpresaDTO
{
    public function __construct(
        public readonly ?string $id = null,
        public readonly ?string $nome = null,
        public readonly ?PaginationDTO $paginacao = null
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            nome: $dados['nome']
        );
    }

    public static function criarParaFiltro(array $dados): self
    {
        // $porPagina = $dados['porPagina'] ?? 10;

        return new self(
            id: $dados['id'] ?? null,
            nome: $dados['nome'] ?? null,
            paginacao: PaginationDTO::criarParaPaginar($dados)
        );
    }
}
