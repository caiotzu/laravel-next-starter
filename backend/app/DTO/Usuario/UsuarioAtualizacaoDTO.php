<?php

namespace App\DTO\Usuario;

final class UsuarioAtualizacaoDTO
{
    private function __construct(
        public readonly string $id,
        public readonly string $grupo_id,
        public readonly string $nome,
        public readonly string $email
    ) {}

    public static function criarParaAtualizacao(string $id, array $dados): self
    {
        return new self(
            id: $id,
            grupo_id: $dados['grupo_id'],
            nome: $dados['nome'],
            email: $dados['email']
        );
    }

    public function paraPersistencia(): array
    {
        return array_filter([
            'grupo_id' => $this->grupo_id,
            'nome' => $this->nome,
            'email' => $this->email
        ], fn ($valor) => ! is_null($valor));
    }

    public function temAlteracoes(): bool
    {
        return ! empty($this->paraPersistencia());
    }
}
