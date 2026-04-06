<?php

namespace App\Enums;

/**
 * Sempre criar o código parametrizado:
 * HTTP CODE + Número do Model que ele representa
 */
enum ErrorCode: int
{
    // Grupo Empresa (model) -> 01
    case GRUPO_EMPRESA_NOT_FOUND = 40401;
    case GRUPO_EMPRESA_REQUIRED = 42201;

    // Usuário Sessão (model) -> 02
    case USUARIO_SESSAO_UNAUTHORIZED = 40102;
    case USUARIO_SESSAO_NOT_FOUND = 40402;

    // Usuário (model) -> 03
    case USUARIO_UNAUTHORIZED = 40103;
    case USUARIO_NOT_FOUND = 40403;

    // Empresa (model) -> 04
    case EMPRESA_NOT_FOUND = 40404;
    case EMPRESA_REQUIRED = 42204;

    // Empresa Contato (model) -> 05
    case EMPRESA_CONTATO_NOT_FOUND = 40405;
    case EMPRESA_CONTATO_REQUIRED = 42205;
}
