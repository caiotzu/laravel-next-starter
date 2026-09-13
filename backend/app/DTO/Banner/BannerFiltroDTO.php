<?php

namespace App\DTO\Banner;

use App\DTO\Common\PaginationDTO;
use App\Enums\BannerStatus;

final class BannerFiltroDTO
{
    public function __construct(
        public readonly ?string $titulo,
        public readonly ?BannerStatus $status,
        public readonly PaginationDTO $paginacao,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        return new self(
            titulo: $dados['titulo'] ?? null,
            status: isset($dados['status']) ? BannerStatus::from($dados['status']) : null,
            paginacao: PaginationDTO::criarParaPaginar($dados),
        );
    }
}
