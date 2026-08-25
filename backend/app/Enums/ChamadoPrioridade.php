<?php

namespace App\Enums;

enum ChamadoPrioridade: string
{
    case BAIXA = 'baixa';
    case NORMAL = 'normal';
    case ALTA = 'alta';
    case URGENTE = 'urgente';

    public function label(): string
    {
        return match ($this) {
            self::BAIXA => 'Baixa',
            self::NORMAL => 'Normal',
            self::ALTA => 'Alta',
            self::URGENTE => 'Urgente',
        };
    }
}
