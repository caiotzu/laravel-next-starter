<?php

namespace App\DTO\Grupo;

final class GrupoCadastroDTO
{
    public function __construct(
        public readonly string $descricao
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            descricao: $dados['descricao']
        );
    }
}
