<?php

namespace App\DTO\Release;

use App\Enums\ReleaseTipo;
use App\Enums\EntidadeTipo as EntidadeTipoChave;

final class ReleaseAtualizacaoDTO
{
    public function __construct(
        public readonly ?EntidadeTipoChave $contexto,
        public readonly ?string $titulo,
        public readonly ?string $conteudo,
        public readonly ?ReleaseTipo $tipo,
        public readonly ?string $versao,
    ) {}

    public static function criarParaAtualizacao(array $dados): self
    {
        return new self(
            contexto: isset($dados['contexto']) ? EntidadeTipoChave::from($dados['contexto']) : null,
            titulo: $dados['titulo'] ?? null,
            conteudo: $dados['conteudo'] ?? null,
            tipo: isset($dados['tipo']) ? ReleaseTipo::from($dados['tipo']) : null,
            versao: $dados['versao'] ?? null,
        );
    }
}
