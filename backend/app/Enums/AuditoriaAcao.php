<?php

namespace App\Enums;

enum AuditoriaAcao: string
{
    case CADASTRO = 'cadastro';
    case ATUALIZACAO = 'atualizacao';
    case EXCLUSAO = 'exclusao';
    case RESTAURACAO = 'restauracao';
}
