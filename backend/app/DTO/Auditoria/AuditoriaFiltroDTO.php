<?php

namespace App\DTO\Auditoria;

use App\DTO\Common\PaginationDTO;

use App\Enums\AuditoriaAcao;

final class AuditoriaFiltroDTO
{
    private function __construct(
        public readonly PaginationDTO $paginacao,
        public readonly ?AuditoriaAcao $acao = null,
        public readonly ?string $usuario_id = null,
        public readonly ?string $data_inicio = null,
        public readonly ?string $data_fim = null,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            paginacao: PaginationDTO::criarParaPaginar($dados),
            acao: isset($dados['acao']) ? AuditoriaAcao::tryFrom($dados['acao']) : null,
            usuario_id: $dados['usuario_id'] ?? null,
            data_inicio: $dados['data_inicio'] ?? null,
            data_fim: $dados['data_fim'] ?? null,
        );
    }
}
