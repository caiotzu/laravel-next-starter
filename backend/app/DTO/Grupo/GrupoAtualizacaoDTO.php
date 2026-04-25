<?php

namespace App\DTO\Grupo;

final class GrupoAtualizacaoDTO
{
    private function __construct(
        public readonly string $id,
        public readonly string $descricao
    ) {}

    public static function criarParaAtualizacao(string $id, array $dados): self
    {
        return new self(
            id: $id,
            descricao: $dados['descricao']
        );
    }

    public function paraPersistencia(): array
    {
        return array_filter([
            'descricao' => $this->descricao,
        ], fn ($valor) => ! is_null($valor));
    }

    public function temAlteracoes(): bool
    {
        return ! empty($this->paraPersistencia());
    }
}
