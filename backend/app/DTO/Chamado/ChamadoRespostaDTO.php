<?php

namespace App\DTO\Chamado;

final class ChamadoRespostaDTO
{
    /**
     * @param array{nome: string, conteudo: string}[] $anexos
     */
    public function __construct(
        public readonly string $usuario_id,
        public readonly string $mensagem,
        public readonly array $anexos = [],
    ) {}

    public static function criarParaResposta(array $dados, string $usuarioId): self
    {
        return new self(
            usuario_id: $usuarioId,
            mensagem: $dados['mensagem'],
            anexos: $dados['anexos'] ?? [],
        );
    }
}
