<?php

namespace App\DTO\UsuarioSessao;

use Carbon\Carbon;

final class UsuarioSessaoCadastroDTO
{
    public function __construct(
        public readonly string $usuario_id,
        public readonly ?string $ip,
        public readonly ?string $user_agent,
        public readonly ?string $browser,
        public readonly ?string $plataforma,
        public readonly ?string $dispositivo,
        public readonly bool $ativo,
        public readonly ?Carbon $ultimo_acesso_em,
        public readonly ?Carbon $logout_em,
    ) {}

    public static function criarParaCadastro(
        string $usuarioId,
        ?string $ip,
        ?string $userAgent,
        ?string $browser,
        ?string $plataforma,
        ?string $dispositivo,
    ): self {
        return new self(
            usuario_id: $usuarioId,
            ip: $ip,
            user_agent: $userAgent,
            browser: $browser,
            plataforma: $plataforma,
            dispositivo: $dispositivo,
            ativo: true,
            ultimo_acesso_em: now(),
            logout_em: null,
        );
    }

    public function paraPersistencia(): array
    {
        return [
            'usuario_id' => $this->usuario_id,
            'ip' => $this->ip,
            'user_agent' => $this->user_agent,
            'browser' => $this->browser,
            'plataforma' => $this->plataforma,
            'dispositivo' => $this->dispositivo,
            'ativo' => true,
            'ultimo_acesso_em' => now(),
            'logout_em' => null,
        ];
    }
}
