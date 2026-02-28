<?php

namespace App\DTO\EmpresaContato;

use App\Enums\EmpresaContatoTipo;

final class EmpresaContatoCadastroDTO
{
    public function __construct(
        public readonly string $empresa_id,
        public readonly EmpresaContatoTipo $tipo,
        public readonly string $valor,
        public readonly bool $ativo,
        public readonly bool $principal,
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            empresa_id: $dados['empresa_id'],
            tipo: EmpresaContatoTipo::from($dados['tipo']),
            valor: $dados['valor'],
            ativo: $dados['ativo'],
            principal: $dados['principal'],
        );
    }
}
