<?php

namespace App\DTO\EmpresaEndereco;

use App\Enums\EmpresaEnderecoTipo;

final class EmpresaEnderecoAtualizacaoDTO
{
    public function __construct(
        public readonly string $endereco_id,
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

    public static function criarParaAtualizacao(
        string $empresaId,
        string $enderecoId,
        array $dados
    ): self
    {
        return new self(
            endereco_id: $enderecoId,
            empresa_id: $empresaId,
            tipo: EmpresaEnderecoTipo::from($dados['tipo']),
            municipio_id: $dados['municipio_id'],
            ativo: $dados['ativo'],
            principal: $dados['principal'],
            cep: $dados['cep'],
            logradouro: $dados['logradouro'],
            numero: $dados['numero'],
            bairro: $dados['bairro'],
            complemento: $dados['complemento'] ?? null
        );
    }

    public function paraPersistencia(): array
    {
        return [
            'tipo' => $this->tipo,
            'municipio_id' => $this->municipio_id,
            'ativo' => $this->ativo,
            'principal' => $this->principal,
            'cep' => $this->cep,
            'logradouro' => $this->logradouro,
            'numero' => $this->numero,
            'bairro' => $this->bairro,
            'complemento' => $this->complemento,
        ];
    }
}
