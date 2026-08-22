<?php

namespace App\Enums;

enum ReleaseTipo: string
{
    case FEATURE = 'feature';
    case IMPROVEMENT = 'improvement';
    case FIX = 'fix';
    case CHANGE = 'change';

    public function label(): string
    {
        return match ($this) {
            self::FEATURE => 'Novidade',
            self::IMPROVEMENT => 'Melhoria',
            self::FIX => 'Correção',
            self::CHANGE => 'Alteração',
        };
    }
}
