<?php

namespace App\DTO\Empresa;

use App\Enums\EmpresaStatus;

final class EmpresaAtualizacaoDTO
{
    public function __construct(
        public readonly string $empresa_id,
        public readonly ?string $matriz_id,
        public readonly string $cnpj,
        public readonly string $nome_fantasia,
        public readonly string $razao_social,
        public readonly ?string $inscricao_estadual,
        public readonly ?string $inscricao_municipal,
        public readonly string $uf,
        public readonly ?EmpresaStatus $status
    ) {}

    public static function criarParaAtualizacao(
        string $empresaId,
        array $dados
    ): self
    {
        return new self(
            empresa_id: $empresaId,
            matriz_id: $dados['matriz_id'] ?? null,
            cnpj: $dados['cnpj'],
            nome_fantasia: $dados['nome_fantasia'],
            razao_social: $dados['razao_social'],
            inscricao_estadual: $dados['inscricao_estadual'] ?? null,
            inscricao_municipal: $dados['inscricao_municipal'] ?? null,
            uf: $dados['uf'],
            status: isset($dados['status']) ? EmpresaStatus::tryFrom($dados['status']) : null,
        );
    }

    public function paraPersistencia(): array
    {
        $dados = [
            'matriz_id' => $this->matriz_id,
            'cnpj' => $this->cnpj,
            'nome_fantasia' => $this->nome_fantasia,
            'razao_social' => $this->razao_social,
            'inscricao_estadual' => $this->inscricao_estadual,
            'inscricao_municipal' => $this->inscricao_municipal,
            'uf' => $this->uf,
            'status' => $this->status,
        ];

        // Se o status vier null não alterar
        if (is_null($this->status)) {
            unset($dados['status']);
        }

        return $dados;
    }
}
