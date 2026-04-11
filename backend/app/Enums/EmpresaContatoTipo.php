<?php

namespace App\Enums;

enum EmpresaContatoTipo: string
{
    case TELEFONE = 'T';
    case EMAIL = 'E';

    public function label(): string
    {
        return match ($this) {
            self::TELEFONE => 'Telefone',
            self::EMAIL => 'E-mail',
        };
    }

    public static function lookup(): array
    {
        return collect(self::cases())
            ->map(fn ($case) => [
                'valor' => $case->value,
                'descricao' => $case->label(),
            ])
            ->values()
            ->toArray();
    }
}
