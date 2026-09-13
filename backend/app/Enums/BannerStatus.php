<?php

namespace App\Enums;

enum BannerStatus: string
{
    case ATIVO = 'ativo';
    case INATIVO = 'inativo';

    public function label(): string
    {
        return match ($this) {
            self::ATIVO => 'Ativo',
            self::INATIVO => 'Inativo',
        };
    }
}
