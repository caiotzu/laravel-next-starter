<?php

namespace App\Enums;

enum EmpresaStatus: string
{
    case PENDENTE = 'pendente';   // Cadastro inicial (faltando endereço/contato)
    case ATIVO = 'ativo';         // Cadastro completo e operante
    case INATIVO = 'inativo';     // Suspenso manualmente
    case BLOQUEADO = 'bloqueado'; // Por questões financeiras ou jurídicas

    public function label(): string
    {
        return match ($this) {
            self::PENDENTE => 'Pendente',
            self::ATIVO => 'Ativo',
            self::INATIVO => 'Inativo',
            self::BLOQUEADO => 'Bloqueado',
        };
    }
}
