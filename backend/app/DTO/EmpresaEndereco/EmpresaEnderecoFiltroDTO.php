<?php

namespace App\DTO\EmpresaEndereco;

final class EmpresaEnderecoFiltroDTO
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
