<?php

namespace App\Enums;

enum UsuarioStatus: string
{
    case CONVIDADO = 'convidado'; // Criado pelo admin, aguardando 1º acesso
    case ATIVO = 'ativo';         // Acesso pleno
    case EXPIRADO = 'expirado';   // Senha expirada ou reset solicitado (obriga a troca)
    case INATIVO = 'inativo';     // Desativado manualmente
    case BLOQUEADO = 'bloqueado'; // Bloqueio por segurança (ex: 5 erros de senha)
}
