<?php

namespace App\DTO\EmpresaContato;

use App\Enums\EmpresaContatoTipo;

final class EmpresaContatoAtualizacaoDTO
{
    public function __construct(
        public readonly string $contato_id,
        public readonly string $empresa_id,
        public readonly EmpresaContatoTipo $tipo,
        public readonly string $valor,
        public readonly bool $ativo,
        public readonly bool $principal,
    ) {}

    public static function criarParaAtualizacao(
        string $empresaId,
        string $contatoId,
        array $dados
    ): self
    {
        return new self(
            contato_id: $contatoId,
            empresa_id: $empresaId,
            tipo: EmpresaContatoTipo::from($dados['tipo']),
            valor: $dados['valor'],
            ativo: $dados['ativo'],
            principal: $dados['principal'],
        );
    }

    public function paraPersistencia(): array
    {
        return [
            'tipo' => $this->tipo,
            'valor' => $this->valor,
            'ativo' => $this->ativo,
            'principal' => $this->principal
        ];
    }
}
