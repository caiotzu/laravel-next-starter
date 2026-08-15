<?php

namespace App\OpenApi\Shared;

use OpenApi\Attributes as OA;

/**
 * Esquema de segurança único do projeto: Bearer JWT (tymon/jwt-auth),
 * emitido pelos endpoints de login (Admin e Private) e validado pelo
 * middleware `jwt` (App\Http\Middleware\JwtMiddleware) em todas as rotas
 * protegidas.
 */
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    description: "Autenticação via **JSON Web Token (JWT)**.\n\n"
        . "1. Faça login em `POST /api/login` (Private) ou `POST /api/admin/login` (Admin).\n"
        . "2. Envie o token retornado no header `Authorization: Bearer {token}` nas demais requisições.\n"
        . 'O token carrega um `session_id`, validado a cada requisição contra a sessão ativa do usuário (tabela de sessões).',
    scheme: 'bearer',
    bearerFormat: 'JWT'
)]
class SecuritySchemes
{
}
