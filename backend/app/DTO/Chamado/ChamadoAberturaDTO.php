<?php

namespace App\DTO\Chamado;

use App\Enums\ChamadoTipo;

final class ChamadoAberturaDTO
{
    /**
     * @param array{nome: string, conteudo: string}[] $anexos Cada item é
     * {nome: nome original do arquivo, conteudo: base64}, mesmo formato já
     * usado por PerfilAvatarBase64AtualizacaoDTO — o proxy Next.js (ver
     * lib/proxy-private.ts) só encaminha JSON, não multipart/form-data,
     * então o upload de anexos segue o mesmo padrão base64 já usado para
     * avatar em vez de um pipeline multipart novo.
     */
    public function __construct(
        public readonly string $usuario_id,
        public readonly ChamadoTipo $tipo,
        public readonly string $assunto,
        public readonly string $mensagem,
        public readonly array $anexos = [],
    ) {}

    public static function criarParaAbertura(array $dados, string $usuarioId): self
    {
        return new self(
            usuario_id: $usuarioId,
            tipo: ChamadoTipo::from($dados['tipo']),
            assunto: $dados['assunto'],
            mensagem: $dados['mensagem'],
            anexos: $dados['anexos'] ?? [],
        );
    }
}
