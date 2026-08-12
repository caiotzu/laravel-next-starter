<?php

namespace App\DTO\Mensagem;

use App\DTO\Common\PaginationDTO;

final class MensagemConsultaFiltroDTO
{
    private function __construct(
        public readonly PaginationDTO $paginacao,
        public readonly ?bool $lida = null,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            paginacao: PaginationDTO::criarParaPaginar($dados),
            lida: $dados['lida'] ?? null,
        );
    }
}
