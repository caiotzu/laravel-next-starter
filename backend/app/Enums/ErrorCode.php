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
}
