<?php

namespace App\DTO\Empresa;

use App\DTO\Empresa\EmpresaContatoOnboardingDTO;
use App\DTO\Empresa\EmpresaEnderecoOnboardingDTO;

final class EmpresaCadastroDTO
{
    /**
     * @param EmpresaContatoOnboardingDTO[] $contatos
     * @param EmpresaEnderecoOnboardingDTO[] $enderecos
     */
    public function __construct(
        public readonly string $grupo_empresa_id,
        public readonly ?string $matriz_id,
        public readonly string $cnpj,
        public readonly string $nome_fantasia,
        public readonly string $razao_social,
        public readonly ?string $inscricao_estadual,
        public readonly ?string $inscricao_municipal,
        public readonly string $uf,
        public readonly array $enderecos,
        public readonly array $contatos,
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            grupo_empresa_id: $dados['grupo_empresa_id'],
            matriz_id: $dados['matriz_id'] ?? null,
            cnpj: $dados['cnpj'],
            nome_fantasia: $dados['nome_fantasia'],
            razao_social: $dados['razao_social'],
            inscricao_estadual: $dados['inscricao_estadual'] ?? null,
            inscricao_municipal: $dados['inscricao_municipal'] ?? null,
            uf: $dados['uf'],
            enderecos: array_map(
                fn ($endereco) => EmpresaEnderecoOnboardingDTO::criarParaCadastro($endereco),
                $dados['enderecos'] ?? []
            ),
            contatos: array_map(
                fn ($contato) => EmpresaContatoOnboardingDTO::criarParaCadastro($contato),
                $dados['contatos'] ?? []
            ),
        );
    }
}
