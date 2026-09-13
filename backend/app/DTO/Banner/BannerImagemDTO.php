<?php

namespace App\DTO\Banner;

/**
 * Uma imagem enviada no cadastro/atualização do banner. Mesmo formato já
 * usado para anexos de chamado (ver AnexosUploader.tsx no frontend):
 * conteúdo em base64 puro, sem o prefixo "data:...;base64,".
 */
final class BannerImagemDTO
{
    public function __construct(
        public readonly string $nome,
        public readonly string $conteudo,
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            nome: $dados['nome'],
            conteudo: $dados['conteudo'],
        );
    }
}
