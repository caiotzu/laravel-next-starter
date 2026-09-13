<?php

namespace App\DTO\Banner;

use App\Enums\BannerDirecionamentoTipo;
use App\Enums\EntidadeTipo;

final class BannerDirecionamentoDTO
{
    public function __construct(
        public readonly BannerDirecionamentoTipo $tipo,
        public readonly ?EntidadeTipo $entidade_tipo = null,
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            tipo: BannerDirecionamentoTipo::from($dados['tipo']),
            entidade_tipo: isset($dados['entidade_tipo']) ? EntidadeTipo::from($dados['entidade_tipo']) : null,
        );
    }
}
