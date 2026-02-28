<?php

namespace App\DTO\Empresa;

use App\DTO\Common\PaginationDTO;

final class EmpresaFiltroDTO
{
    private function __construct(
        public readonly ?string $id = null,
        public readonly ?string $grupo_empresa_id = null,
        public readonly ?string $matriz_id = null,
        public readonly ?string $cnpj = null,
        public readonly ?string $nome_fantasia = null,
        public readonly ?string $razao_social = null,
        public readonly ?string $inscricao_estadual = null,
        public readonly ?string $inscricao_municipal = null,
        public readonly ?string $ativo = null,
        public readonly ?string $uf = null,
        public readonly ?bool $excluido = null,
        public readonly PaginationDTO $paginacao
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            id: $dados['id'] ?? null,
            grupo_empresa_id: $dados['grupo_empresa_id'] ?? null,
            matriz_id: $dados['matriz_id'] ?? null,
            cnpj: $dados['cnpj'] ?? null,
            nome_fantasia: $dados['nome_fantasia'] ?? null,
            razao_social: $dados['razao_social'] ?? null,
            inscricao_estadual: $dados['inscricao_estadual'] ?? null,
            inscricao_municipal: $dados['inscricao_municipal'] ?? null,
            ativo: $dados['ativo'] ?? null,
            uf: $dados['uf'] ?? null,
            excluido: $dados['excluido'] ?? null,
            paginacao: PaginationDTO::criarParaPaginar($dados),
        );
    }
}
