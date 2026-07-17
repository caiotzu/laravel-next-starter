<?php

namespace App\DTO\Usuario;

use App\Enums\UsuarioStatus;

final class UsuarioAtualizacaoDTO
{
    private function __construct(
        public readonly string $id,
        public readonly string $grupo_id,
        public readonly string $nome,
        public readonly string $email,
        public readonly ?UsuarioStatus $status
    ) {}

    public static function criarParaAtualizacao(string $id, array $dados): self
    {
        return new self(
            id: $id,
            grupo_id: $dados['grupo_id'],
            nome: $dados['nome'],
            email: $dados['email'],
            status: isset($dados['status']) ? UsuarioStatus::tryFrom($dados['status']) : null,
        );
    }

    public function paraPersistencia(): array
    {
        return array_filter([
            'grupo_id' => $this->grupo_id,
            'nome' => $this->nome,
            'email' => $this->email,
            'status' => $this->status
        ], fn ($valor) => ! is_null($valor));
    }

    public function temAlteracoes(): bool
    {
        return ! empty($this->paraPersistencia());
    }
}
