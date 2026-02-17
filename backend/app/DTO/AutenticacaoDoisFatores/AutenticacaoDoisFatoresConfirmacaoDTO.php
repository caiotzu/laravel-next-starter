<?php

namespace App\DTO\AutenticacaoDoisFatores;

use App\Models\Usuario;

class AutenticacaoDoisFatoresConfirmacaoDTO
{
    public function __construct(
        public Usuario $usuario,
        public string $codigo,
    ) {}
}
