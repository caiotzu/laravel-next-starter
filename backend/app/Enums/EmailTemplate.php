<?php

namespace App\Enums;

enum EmailTemplate: string
{
    case USUARIO_CRIADO = 'emails.usuarios.usuario-criado';
    // case SENHA_REDEFINIDA = 'emails.usuarios.senha-redefinida';
}
