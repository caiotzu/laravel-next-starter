<?php

namespace App\DTO\Mensagem;

use App\DTO\Common\PaginationDTO;

final class MensagemBuscaUsuarioFiltroDTO
{
    private function __construct(
        public readonly PaginationDTO $paginacao,
        public readonly ?string $nome = null,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            paginacao: PaginationDTO::criarParaPaginar($dados),
            nome: $dados['nome'] ?? null,
        );
    }
}
