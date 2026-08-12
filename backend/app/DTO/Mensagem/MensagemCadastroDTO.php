<?php

namespace App\DTO\Mensagem;

final class MensagemCadastroDTO
{
    public function __construct(
        public readonly string $titulo,
        public readonly string $conteudo,
        public readonly MensagemDirecionamentoDTO $direcionamento,
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            titulo: $dados['titulo'],
            conteudo: $dados['conteudo'],
            direcionamento: MensagemDirecionamentoDTO::criarParaCadastro($dados['direcionamento']),
        );
    }
}
