<?php

namespace App\OpenApi\Admin;

use OpenApi\Attributes as OA;

/**
 * Definição raiz (Info/Server) da documentação Admin. Esta spec é servida
 * em uma rota separada (/api/documentation/admin) e protegida por
 * autenticação HTTP Basic configurada via .env (ver SwaggerAdminAuth).
 */
#[OA\Info(
    version: '1.0.0',
    title: 'Laravel Next Starter API — Admin',
    description: "Documentação da área **Admin** (equipe interna / back-office) do projeto Laravel Next Starter.\n\n"
        . "Esta documentação é restrita: o acesso à interface Swagger UI e ao JSON da spec exige autenticação "
        . "HTTP Basic própria da documentação (usuário/senha definidos em `.env`), **independente** do login da API.\n\n"
        . 'Após acessar a documentação, os endpoints em si continuam exigindo o Bearer JWT obtido em `POST /api/admin/login`.',
    contact: new OA\Contact(name: 'Equipe de Desenvolvimento')
)]
#[OA\Server(
    url: '/api',
    description: 'Servidor da API (relativo ao host onde o Swagger UI está sendo servido)'
)]
#[OA\Tag(name: 'Admin', description: 'Endpoints administrativos (back-office), restritos a usuários da entidade Admin.')]
class OpenApiSpec
{
}
