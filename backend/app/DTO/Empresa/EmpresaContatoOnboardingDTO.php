<?php

namespace App\DTO\Empresa;

use App\Enums\EmpresaContatoTipo;

final class EmpresaContatoOnboardingDTO
{
    public function __construct(
        public readonly EmpresaContatoTipo $tipo,
        public readonly string $valor,
        public readonly bool $ativo,
        public readonly bool $principal,
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            tipo: EmpresaContatoTipo::from($dados['tipo']),
            valor: $dados['valor'],
            ativo: $dados['ativo'],
            principal: $dados['principal'],
        );
    }
}
