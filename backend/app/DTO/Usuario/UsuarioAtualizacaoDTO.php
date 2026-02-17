<?php

namespace App\DTO\Usuario;

final class UsuarioAtualizacaoDTO
{
    private function __construct(
        public readonly string $id,
        public readonly ?string $nome,
        public readonly ?string $email
    ) {}

    public static function criarParaAtualizacao(string $id, array $dados): self
    {
        return new self(
            id: $id,
            nome: $dados['nome'] ?? null,
            email: $dados['email'] ?? null
        );
    }

    public function paraPersistencia(): array
    {
        return array_filter([
            'nome' => $this->nome,
            'email' => $this->email
        ], fn ($valor) => ! is_null($valor));
    }

    public function temAlteracoes(): bool
    {
        return count($this->paraPersistencia()) > 0;
    }
}
