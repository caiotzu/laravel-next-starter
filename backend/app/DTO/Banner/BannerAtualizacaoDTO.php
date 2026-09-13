<?php

namespace App\DTO\Banner;

final class BannerAtualizacaoDTO
{
    /**
     * @param BannerImagemAtualizacaoDTO[] $imagens
     * @param BannerLinkAtualizacaoDTO[] $links
     */
    public function __construct(
        public readonly string $id,
        public readonly string $titulo,
        public readonly ?string $conteudo,
        public readonly \DateTimeInterface $inicio_em,
        public readonly ?\DateTimeInterface $fim_em,
        public readonly BannerDirecionamentoDTO $direcionamento,
        public readonly array $imagens,
        public readonly array $links,
    ) {}

    public static function criarParaAtualizacao(string $id, array $dados): self
    {
        return new self(
            id: $id,
            titulo: $dados['titulo'],
            conteudo: $dados['conteudo'] ?? null,
            inicio_em: new \DateTimeImmutable($dados['inicio_em']),
            fim_em: isset($dados['fim_em']) ? new \DateTimeImmutable($dados['fim_em']) : null,
            direcionamento: BannerDirecionamentoDTO::criarParaCadastro($dados['direcionamento']),
            imagens: array_values(array_map(
                fn (array $imagem, int $indice) => BannerImagemAtualizacaoDTO::criarParaAtualizacao($imagem, $indice),
                $dados['imagens'] ?? [],
                array_keys($dados['imagens'] ?? [])
            )),
            links: array_values(array_map(
                fn (array $link, int $indice) => BannerLinkAtualizacaoDTO::criarParaAtualizacao($link, $indice),
                $dados['links'] ?? [],
                array_keys($dados['links'] ?? [])
            )),
        );
    }
}
