<?php

namespace App\Enums;

enum MensagemOrigem: string
{
    case SISTEMA = 'sistema'; // Gerada automaticamente pelo próprio sistema
    case ADMIN = 'admin';     // Enviada manualmente por um usuário administrativo

    public function label(): string
    {
        return match ($this) {
            self::SISTEMA => 'Sistema',
            self::ADMIN => 'Administrador',
        };
    }
}
