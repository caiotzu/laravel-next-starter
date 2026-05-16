<?php

namespace App\DTO\Usuario;

final class UsuarioRedefinirSenhaDTO
{
    public function __construct(
        public readonly string $token,
        public readonly string $senha,
        public readonly string $senha_confirma
    ) {}

    public static function criarParaRedefinirSenha(array $dados): self
    {
        return new self(
            token: $dados['token'],
            senha: $dados['senha'],
            senha_confirma: $dados['senha_confirma']
        );
    }
}
