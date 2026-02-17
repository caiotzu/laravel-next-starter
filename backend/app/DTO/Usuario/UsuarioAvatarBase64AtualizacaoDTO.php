<?php

namespace App\DTO\Usuario;

final class UsuarioAvatarBase64AtualizacaoDTO
{
    private function __construct(
        public readonly string $usuarioId,
        public readonly string $base64,
    ) {}

    public static function criarParaAtualizacao(string $usuarioId, string $base64): self
    {
        return new self(
            usuarioId: $usuarioId,
            base64: $base64,
        );
    }
}
