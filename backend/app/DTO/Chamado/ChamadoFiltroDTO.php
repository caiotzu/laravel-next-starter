<?php

namespace App\DTO\Chamado;

use App\DTO\Common\PaginationDTO;

use App\Enums\ChamadoStatus;
use App\Enums\ChamadoTipo;
use App\Enums\ChamadoPrioridade;

final class ChamadoFiltroDTO
{
    private function __construct(
        public readonly PaginationDTO $paginacao,
        public readonly ?ChamadoStatus $status = null,
        public readonly ?ChamadoTipo $tipo = null,
        public readonly ?ChamadoPrioridade $prioridade = null,
        public readonly ?string $responsavel_id = null,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            paginacao: PaginationDTO::criarParaPaginar($dados),
            status: isset($dados['status']) ? ChamadoStatus::from($dados['status']) : null,
            tipo: isset($dados['tipo']) ? ChamadoTipo::from($dados['tipo']) : null,
            prioridade: isset($dados['prioridade']) ? ChamadoPrioridade::from($dados['prioridade']) : null,
            responsavel_id: $dados['responsavel_id'] ?? null,
        );
    }
}
