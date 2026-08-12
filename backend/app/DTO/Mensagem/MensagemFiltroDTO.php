<?php

namespace App\DTO\Mensagem;

use App\DTO\Common\PaginationDTO;

use App\Enums\MensagemOrigem;

final class MensagemFiltroDTO
{
    private function __construct(
        public readonly PaginationDTO $paginacao,
        public readonly ?string $id = null,
        public readonly ?string $titulo = null,
        public readonly ?MensagemOrigem $origem = null,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            paginacao: PaginationDTO::criarParaPaginar($dados),
            id: $dados['id'] ?? null,
            titulo: $dados['titulo'] ?? null,
            origem: isset($dados['origem']) ? MensagemOrigem::from($dados['origem']) : null,
        );
    }
}
