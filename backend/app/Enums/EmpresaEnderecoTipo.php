<?php

namespace App\Enums;

enum EmpresaEnderecoTipo: string
{
    case COMERCIAL = 'COMERCIAL';
    case FISCAL = 'FISCAL';
    case COBRANCA = 'COBRANCA';
    case ENTREGA = 'ENTREGA';

    public function label(): string
    {
        return match ($this) {
            self::COMERCIAL => 'Comercial',
            self::FISCAL => 'Fiscal',
            self::COBRANCA => 'Cobrança',
            self::ENTREGA => 'Entrega',
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
