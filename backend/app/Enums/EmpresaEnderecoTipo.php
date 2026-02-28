<?php

namespace App\Enums;

enum EmpresaEnderecoTipo: string
{
    case COMERCIAL = 'COMERCIAL';
    case FISCAL = 'FISCAL';
    case COBRANCA = 'COBRANCA';
    case ENTREGA = 'ENTREGA';
}
