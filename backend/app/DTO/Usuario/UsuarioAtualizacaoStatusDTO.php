<?php

namespace App\DTO\Usuario;

use App\Enums\UsuarioStatus;

final class UsuarioAtualizacaoStatusDTO
{
    private function __construct(
        public readonly string $grupoId,
        public readonly string $usuarioId,
        public readonly UsuarioStatus $status
    ) {}

    public static function criarParaAtualizacaoStatus(string $grupoId, string $usuarioId, array $dados): self
    {
        return new self(
            grupoId: $grupoId,
            usuarioId: $usuarioId,
            status: isset($dados['status']) ? UsuarioStatus::tryFrom($dados['status']) : null,
        );
    }

    public function paraPersistencia(): array
    {
        return array_filter([
            'status' => $this->status
        ], fn ($valor) => ! is_null($valor));
    }

    public function temAlteracoes(): bool
    {
        return ! empty($this->paraPersistencia());
    }
}
