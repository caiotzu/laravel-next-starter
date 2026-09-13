<?php

namespace App\DTO\Banner;

/**
 * Um item da lista de imagens enviada na atualização do banner.
 *
 * `id` presente = imagem já existente que deve ser mantida (apenas a
 * `ordem` pode mudar). `id` ausente = imagem nova, enviada em base64
 * (mesmo formato do cadastro). O Service reconcilia a lista completa
 * enviada com o que já existe no banco: o que não estiver na lista é
 * removido (ver BannerService::sincronizarImagens).
 */
final class BannerImagemAtualizacaoDTO
{
    public function __construct(
        public readonly ?string $id,
        public readonly ?string $nome,
        public readonly ?string $conteudo,
        public readonly int $ordem,
    ) {}

    public static function criarParaAtualizacao(array $dados, int $ordem): self
    {
        return new self(
            id: $dados['id'] ?? null,
            nome: $dados['nome'] ?? null,
            conteudo: $dados['conteudo'] ?? null,
            ordem: $ordem,
        );
    }

    public function ehNova(): bool
    {
        return $this->id === null;
    }
}
