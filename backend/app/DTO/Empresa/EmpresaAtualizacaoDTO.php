<?php

namespace App\DTO\Empresa;

final class EmpresaAtualizacaoDTO
{
    public function __construct(
        public readonly ?string $matriz_id,
        public readonly string $cnpj,
        public readonly string $nome_fantasia,
        public readonly string $razao_social,
        public readonly ?string $inscricao_estadual,
        public readonly ?string $inscricao_municipal,
        public readonly bool $ativo,
        public readonly string $uf
    ) {}

    public static function criarParaAtualizacao(array $dados): self
    {
        return new self(
            matriz_id: $dados['matriz_id'] ?? null,
            cnpj: $dados['cnpj'],
            nome_fantasia: $dados['nome_fantasia'],
            razao_social: $dados['razao_social'],
            inscricao_estadual: $dados['inscricao_estadual'] ?? null,
            inscricao_municipal: $dados['inscricao_municipal'] ?? null,
            ativo: $dados['ativo'],
            uf: $dados['uf'],
        );
    }

    public function paraPersistencia(): array
    {
        return [
            'matriz_id' => $this->matriz_id,
            'cnpj' => $this->cnpj,
            'nome_fantasia' => $this->nome_fantasia,
            'razao_social' => $this->razao_social,
            'inscricao_estadual' => $this->inscricao_estadual,
            'inscricao_municipal' => $this->inscricao_municipal,
            'ativo' => $this->ativo,
            'uf' => $this->uf
        ];
    }
}
