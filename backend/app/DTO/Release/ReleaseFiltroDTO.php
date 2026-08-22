<?php

namespace App\DTO\Release;

use App\DTO\Common\PaginationDTO;

use App\Enums\ReleaseTipo;
use App\Enums\ReleaseStatus;
use App\Enums\EntidadeTipo as EntidadeTipoChave;

final class ReleaseFiltroDTO
{
    private function __construct(
        public readonly PaginationDTO $paginacao,
        public readonly ?EntidadeTipoChave $contexto = null,
        public readonly ?ReleaseStatus $status = null,
        public readonly ?ReleaseTipo $tipo = null,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            paginacao: PaginationDTO::criarParaPaginar($dados),
            contexto: isset($dados['contexto']) ? EntidadeTipoChave::from($dados['contexto']) : null,
            status: isset($dados['status']) ? ReleaseStatus::from($dados['status']) : null,
            tipo: isset($dados['tipo']) ? ReleaseTipo::from($dados['tipo']) : null,
        );
    }
}
