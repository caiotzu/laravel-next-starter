<?php

namespace App\DTO\Usuario;

final class UsuarioCadastroDTO
{
    public function __construct(
        public readonly string $grupo_id,
        public readonly string $nome,
        public readonly string $email
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            grupo_id: $dados['grupo_id'],
            nome: $dados['nome'],
            email: $dados['email']
        );
    }
}
