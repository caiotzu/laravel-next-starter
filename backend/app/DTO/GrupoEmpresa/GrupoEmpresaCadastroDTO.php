<?php

namespace App\DTO\GrupoEmpresa;

use App\DTO\Common\PaginationDTO;

final class GrupoEmpresaCadastroDTO
{
    private function __construct(
        public readonly string $nome
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            nome: $dados['nome']
        );
    }
}
