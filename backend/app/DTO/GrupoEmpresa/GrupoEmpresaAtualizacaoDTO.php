<?php

namespace App\DTO\GrupoEmpresa;

use App\DTO\Common\PaginationDTO;

final class GrupoEmpresaAtualizacaoDTO
{
    private function __construct(
        public readonly string $id,
        public readonly string $nome
    ) {}

    public static function criarParaAtualizacao(string $id, array $dados): self
    {
        return new self(
            id: $id,
            nome: $dados['nome']
        );
    }

    public function paraPersistencia(): array
    {
        return array_filter([
            'nome' => $this->nome,
        ], fn ($valor) => ! is_null($valor));
    }

    public function temAlteracoes(): bool
    {
        return ! empty($this->paraPersistencia());
    }
}
