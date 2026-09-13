<?php

namespace App\DTO\Banner;

final class BannerLinkDTO
{
    public function __construct(
        public readonly string $nome,
        public readonly string $url,
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            nome: $dados['nome'],
            url: $dados['url'],
        );
    }
}
