<?php

namespace App\DTO\Banner;

/**
 * Uma imagem enviada no cadastro do banner. `nome` é só um rótulo
 * informativo (nome original do arquivo, usado em mensagens de erro) —
 * nunca a origem de verdade da imagem nem o nome do arquivo persistido
 * (ver BannerService::armazenarImagem, que sempre gera um nome novo via
 * UUID). Por isso é opcional: quando ausente, o Service gera um rótulo
 * padrão automaticamente, em vez de obrigar o usuário a preenchê-lo.
 */
final class BannerImagemDTO
{
    public function __construct(
        public readonly ?string $nome,
        public readonly string $conteudo,
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            nome: $dados['nome'] ?? null,
            conteudo: $dados['conteudo'],
        );
    }
}
