<?php

namespace App\Enums;

enum AcessoSuporteStatus: string
{
    case ATIVO = 'ativo';
    case EXPIRADO = 'expirado';
    case REVOGADO = 'revogado';
    case ENCERRADO = 'encerrado';
}
