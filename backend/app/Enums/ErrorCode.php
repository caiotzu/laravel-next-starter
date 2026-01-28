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
}
