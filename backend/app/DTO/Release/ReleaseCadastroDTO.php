<?php

namespace App\DTO\Release;

use App\Enums\ReleaseTipo;
use App\Enums\EntidadeTipo as EntidadeTipoChave;

final class ReleaseCadastroDTO
{
    public function __construct(
        public readonly EntidadeTipoChave $contexto,
        public readonly string $titulo,
        public readonly string $conteudo,
        public readonly ReleaseTipo $tipo,
        public readonly string $versao,
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            contexto: EntidadeTipoChave::from($dados['contexto']),
            titulo: $dados['titulo'],
            conteudo: $dados['conteudo'],
            tipo: ReleaseTipo::from($dados['tipo']),
            versao: $dados['versao'],
        );
    }
}
