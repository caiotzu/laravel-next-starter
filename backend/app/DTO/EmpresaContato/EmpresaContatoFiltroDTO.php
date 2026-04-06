<?php

namespace App\DTO\EmpresaContato;

final class EmpresaContatoFiltroDTO
{
    private function __construct(
        public readonly string $empresaId,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            empresaId: $dados['empresaId']
        );
    }
}
