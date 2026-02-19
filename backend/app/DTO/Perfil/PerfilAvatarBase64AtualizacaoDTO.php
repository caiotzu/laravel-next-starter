<?php

namespace App\DTO\Perfil;

use App\Models\Usuario;

final class PerfilAvatarBase64AtualizacaoDTO
{
    private function __construct(
        public readonly Usuario $usuario,
        public readonly string $base64,
    ) {}

    public static function criarParaAtualizacao(Usuario $usuario, string $base64): self
    {
        return new self(
            usuario: $usuario,
            base64: $base64,
        );
    }
}
