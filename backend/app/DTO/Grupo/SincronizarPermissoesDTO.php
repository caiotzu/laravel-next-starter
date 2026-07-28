<?php

namespace App\DTO\Grupo;

use App\Enums\PermissaoTipo;

final class SincronizarPermissoesDTO
{
    public function __construct(
        public readonly string $grupo_id,
        public readonly PermissaoTipo $permissao_tipo,
        /** @var string[] */
        public readonly array $permissoes
    ) {}

    public static function criarParaSincronizacaoDasPermissoes(string $grupoId, PermissaoTipo $permissaoTipo, array $dados): self
    {
        return new self(
            grupo_id: $grupoId,
            permissao_tipo: $permissaoTipo,
            permissoes: $dados['permissoes']
        );
    }
}
