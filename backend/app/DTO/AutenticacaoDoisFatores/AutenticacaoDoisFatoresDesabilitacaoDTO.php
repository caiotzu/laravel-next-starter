<?php

namespace App\DTO\AutenticacaoDoisFatores;

use App\Models\Usuario;

class AutenticacaoDoisFatoresDesabilitacaoDTO
{
    public function __construct(
        public Usuario $usuario,
        public string $senha,
        public string $codigo,
    ) {}
}
