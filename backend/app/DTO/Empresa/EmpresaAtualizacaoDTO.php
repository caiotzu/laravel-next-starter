<?php

namespace App\DTO\Empresa;

use Illuminate\Support\Arr;

use App\Enums\EmpresaStatus;

final class EmpresaAtualizacaoDTO
{
    public function __construct(
        public readonly string $empresa_id,
        public readonly ?string $matriz_id,
        public readonly ?string $cnpj,
        public readonly ?string $nome_fantasia,
        public readonly ?string $razao_social,
        public readonly ?string $inscricao_estadual,
        public readonly ?string $inscricao_municipal,
        public readonly ?string $uf,
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
            cnpj: $dados['cnpj'] ?? null,
            nome_fantasia: $dados['nome_fantasia'] ?? null,
            razao_social: $dados['razao_social'] ?? null,
            inscricao_estadual: $dados['inscricao_estadual'] ?? null,
            inscricao_municipal: $dados['inscricao_municipal'] ?? null,
            uf: $dados['uf'] ?? null,
            status: isset($dados['status']) ? EmpresaStatus::tryFrom($dados['status']) : null,
        );
    }

    /**
     * Quais campos do payload são de fato persistidos depende de o
     * contexto atual ser irrestrito ou não — ver
     * App\Services\EscopoEntidadeService::irrestrito() — e não mais de um
     * EntidadeTipo decidido manualmente pelo Controller que chamou este
     * método (ver EmpresaService::atualizar()).
     *
     * Irrestrito (Admin fora de modo de suporte): todos os campos,
     * inclusive os administrativos (cnpj, status).
     *
     * Não irrestrito (Private, ou Admin em modo de suporte — contexto
     * efetivo passa a ser o da entidade Private impersonada): apenas os
     * campos cadastrais, sem cnpj/status.
     */
    public function paraPersistencia(bool $irrestrito): array
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

        if ($irrestrito) {
            return $dados;
        }

        return Arr::only($dados, [
            'matriz_id',
            'nome_fantasia',
            'razao_social',
            'inscricao_estadual',
            'inscricao_municipal',
            'uf'
        ]);
    }
}
