<?php

namespace App\DTO\UsuarioSessao;

use Carbon\Carbon;

final class UsuarioSessaoAtualizacaoDTO
{
    private function __construct(
        public readonly string $id,
        public readonly ?bool $ativo = null,
        public readonly ?Carbon $ultimo_acesso_em = null,
        public readonly ?Carbon $logout_em = null,
    ) {}


    public static function paraLogout(string $id): self
    {
        return new self(
            id: $id,
            ativo: false,
            logout_em: now(),
        );
    }

    public static function paraAtualizarAcesso(string $id): self
    {
        return new self(
            id: $id,
            ultimo_acesso_em: now(),
        );
    }

    public function paraPersistencia(): array
    {
        return array_filter([
            'ativo' => $this->ativo,
            'ultimo_acesso_em' => $this->ultimo_acesso_em,
            'logout_em' => $this->logout_em,
        ], fn ($valor) => !is_null($valor));
    }
}
