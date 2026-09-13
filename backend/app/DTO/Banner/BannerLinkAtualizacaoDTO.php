<?php

namespace App\DTO\Banner;

final class BannerLinkAtualizacaoDTO
{
    public function __construct(
        public readonly ?string $id,
        public readonly string $nome,
        public readonly string $url,
        public readonly int $ordem,
    ) {}

    public static function criarParaAtualizacao(array $dados, int $ordem): self
    {
        return new self(
            id: $dados['id'] ?? null,
            nome: $dados['nome'],
            url: $dados['url'],
            ordem: $ordem,
        );
    }
}
