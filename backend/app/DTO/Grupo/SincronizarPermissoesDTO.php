<?php

namespace App\DTO\Grupo;

final class SincronizarPermissoesDTO
{
    public function __construct(
        public readonly string $grupo_id,
        /** @var string[] */
        public readonly array $permissoes
    ) {}

    public static function criarParaSincronizacaoDasPermissoes(string $grupoId, array $dados): self
    {
        return new self(
            grupo_id: $grupoId,
            permissoes: $dados['permissoes']
        );
    }
}
