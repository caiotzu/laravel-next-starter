<?php

namespace App\DTO\Mensagem;

use App\Enums\MensagemDirecionamentoTipo;
use App\Enums\EntidadeTipo;

final class MensagemDirecionamentoDTO
{
    public function __construct(
        public readonly MensagemDirecionamentoTipo $tipo,
        public readonly ?EntidadeTipo $entidade_tipo = null,
        public readonly ?string $grupo_empresa_id = null,
        public readonly ?string $usuario_id = null,
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            tipo: MensagemDirecionamentoTipo::from($dados['tipo']),
            entidade_tipo: isset($dados['entidade_tipo']) ? EntidadeTipo::from($dados['entidade_tipo']) : null,
            grupo_empresa_id: $dados['grupo_empresa_id'] ?? null,
            usuario_id: $dados['usuario_id'] ?? null,
        );
    }
}
