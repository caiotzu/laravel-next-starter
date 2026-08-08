<?php

namespace App\DTO\Auditoria;

use App\DTO\Common\PaginationDTO;

use App\Enums\AuditoriaAcao;

final class AuditoriaFiltroDTO
{
    private function __construct(
        public readonly PaginationDTO $paginacao,
        public readonly ?string $entidade_tabela = null,
        public readonly ?string $entidade_id = null,
        public readonly ?string $agrupador_tabela = null,
        public readonly ?string $agrupador_id = null,
        public readonly bool $incluir_dependentes = false,
        public readonly ?AuditoriaAcao $acao = null,
        public readonly ?string $usuario_id = null,
        public readonly ?string $data_inicio = null,
        public readonly ?string $data_fim = null,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            paginacao: PaginationDTO::criarParaPaginar($dados),
            entidade_tabela: $dados['entidade_tabela'] ?? null,
            entidade_id: $dados['entidade_id'] ?? null,
            agrupador_tabela: $dados['agrupador_tabela'] ?? null,
            agrupador_id: $dados['agrupador_id'] ?? null,
            incluir_dependentes: filter_var($dados['incluir_dependentes'] ?? false, FILTER_VALIDATE_BOOLEAN),
            acao: isset($dados['acao']) ? AuditoriaAcao::tryFrom($dados['acao']) : null,
            usuario_id: $dados['usuario_id'] ?? null,
            data_inicio: $dados['data_inicio'] ?? null,
            data_fim: $dados['data_fim'] ?? null,
        );
    }
}
