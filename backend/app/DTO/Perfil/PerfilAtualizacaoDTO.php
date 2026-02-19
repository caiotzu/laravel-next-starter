<?php

namespace App\DTO\Perfil;

use App\Models\Usuario;

final class PerfilAtualizacaoDTO
{
    private function __construct(
        public readonly Usuario $usuario,
        public readonly ?string $nome,
        public readonly ?string $email
    ) {}

    public static function criarParaAtualizacao(Usuario $usuario, array $dados): self
    {
        return new self(
            usuario: $usuario,
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
