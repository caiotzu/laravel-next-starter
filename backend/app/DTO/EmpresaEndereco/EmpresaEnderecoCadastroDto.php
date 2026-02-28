<?php

namespace App\DTO\EmpresaEndereco;

use App\Enums\EmpresaEnderecoTipo;

final class EmpresaEnderecoCadastroDTO
{
    public function __construct(
        public readonly string $empresa_id,
        public readonly EmpresaEnderecoTipo $tipo,
        public readonly string $municipio_id,
        public readonly bool $ativo,
        public readonly bool $principal,
        public readonly string $cep,
        public readonly string $logradouro,
        public readonly string $numero,
        public readonly string $bairro,
        public readonly ?string $complemento,

    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            empresa_id: $dados['empresa_id'] ?? null,
            tipo: EmpresaEnderecoTipo::from($dados['tipo']),
            municipio_id: $dados['municipio_id'],
            ativo: $dados['ativo'],
            principal: $dados['principal'],
            cep: $dados['cep'],
            logradouro: $dados['logradouro'],
            numero: $dados['numero'],
            bairro: $dados['bairro'],
            complemento: $dados['complemento'] ?? null,
        );
    }
}
