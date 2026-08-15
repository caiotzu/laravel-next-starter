<?php

/**
 * Credenciais de acesso à documentação Swagger da área Admin.
 *
 * IMPORTANTE: nunca hardcode usuário/senha aqui. Configure via .env:
 *
 *   SWAGGER_ADMIN_USERNAME=algum-usuario
 *   SWAGGER_ADMIN_PASSWORD_HASH="$2y$10$..."   (gerado com Hash::make('sua-senha'))
 *
 * Enquanto essas variáveis não forem definidas, o middleware
 * App\Http\Middleware\SwaggerAdminAuth bloqueia o acesso por padrão.
 */
return [
    'username' => env('SWAGGER_ADMIN_USERNAME'),
    'password_hash' => env('SWAGGER_ADMIN_PASSWORD_HASH'),
];
