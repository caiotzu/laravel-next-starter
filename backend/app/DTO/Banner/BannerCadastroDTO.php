<?php

namespace App\DTO\Banner;

final class BannerCadastroDTO
{
    /**
     * @param BannerImagemDTO[] $imagens
     * @param BannerLinkDTO[] $links
     */
    public function __construct(
        public readonly string $titulo,
        public readonly ?string $conteudo,
        public readonly \DateTimeInterface $inicio_em,
        public readonly ?\DateTimeInterface $fim_em,
        public readonly BannerDirecionamentoDTO $direcionamento,
        public readonly array $imagens,
        public readonly array $links,
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            titulo: $dados['titulo'],
            conteudo: $dados['conteudo'] ?? null,
            inicio_em: new \DateTimeImmutable($dados['inicio_em']),
            fim_em: isset($dados['fim_em']) ? new \DateTimeImmutable($dados['fim_em']) : null,
            direcionamento: BannerDirecionamentoDTO::criarParaCadastro($dados['direcionamento']),
            imagens: array_map(
                fn (array $imagem) => BannerImagemDTO::criarParaCadastro($imagem),
                $dados['imagens'] ?? []
            ),
            links: array_map(
                fn (array $link) => BannerLinkDTO::criarParaCadastro($link),
                $dados['links'] ?? []
            ),
        );
    }
}
