<?php

namespace App\DTO\EmpresaContato;

final class EmpresaContatoFiltroDTO
{
    private function __construct(
        public readonly string $empresa_id,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            empresa_id: $dados['empresa_id']
        );
    }
}
