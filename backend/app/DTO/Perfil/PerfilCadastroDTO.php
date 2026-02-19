<?php

namespace App\DTO\Perfil;

final class PerfilCadastroDTO
{
    public function __construct(
        public readonly string $nome,
        public readonly string $email,
        public readonly string $grupo_id,
        public readonly ?string $avatar = null,
        public readonly bool $google2fa_enable = false,
        public readonly ?string $google2fa_secret = null,
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            nome: $dados['nome'],
            email: $dados['email'],
            grupo_id: $dados['grupo_id'],
            avatar: $dados['avatar'] ?? null,
            google2fa_enable: $dados['google2fa_enable'] ?? false,
            google2fa_secret: $dados['google2fa_secret'] ?? null,
        );
    }
}
