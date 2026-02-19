<?php

namespace App\DTO\Perfil;

use App\Models\Usuario;

final class PerfilAtualizacaoSenhaDTO
{
    private function __construct(
        public readonly Usuario $usuario,
        public readonly string $senha_nova,
    ) {}

    public static function criarParaAtualizacaoSenha(Usuario $usuario, array $dados): self
    {
        return new self(
            usuario: $usuario,
            senha_nova: $dados['senha_nova']
        );
    }
}
