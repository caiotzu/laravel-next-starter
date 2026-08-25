<?php

namespace App\Enums;

enum ChamadoTipo: string
{
    case FINANCEIRO = 'financeiro';
    case PLATAFORMA = 'plataforma';
    case ACESSO = 'acesso';
    case DUVIDA = 'duvida';
    case DOCUMENTACAO = 'documentacao';
    case OPERACIONAL = 'operacional';
    case OUTROS = 'outros';

    public function label(): string
    {
        return match ($this) {
            self::FINANCEIRO => 'Financeiro',
            self::PLATAFORMA => 'Problema na plataforma',
            self::ACESSO => 'Dificuldade de acesso',
            self::DUVIDA => 'Dúvida',
            self::DOCUMENTACAO => 'Documentação',
            self::OPERACIONAL => 'Problema operacional',
            self::OUTROS => 'Outros',
        };
    }
}
