<?php

namespace App\DTO\AutenticacaoDoisFatores;

use App\Models\Usuario;

class AutenticacaoDoisFatoresHabilitacaoDTO
{
    public function __construct(
        public Usuario $usuario,
        public string $senha
    ) {}
}
