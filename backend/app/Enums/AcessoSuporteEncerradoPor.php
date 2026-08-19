<?php

namespace App\Enums;

/**
 * Quem/o que encerrou um Acesso de Suporte — usado tanto para UX
 * ("revogado pelo cliente" vs "encerrado pelo admin") quanto para
 * auditoria/forense em caso de incidente.
 */
enum AcessoSuporteEncerradoPor: string
{
    case CLIENTE = 'cliente';
    case ADMIN = 'admin';
    case EXPIRACAO = 'expiracao';
    case SISTEMA = 'sistema';
}
