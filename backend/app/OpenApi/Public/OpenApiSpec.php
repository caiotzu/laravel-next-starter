<?php

namespace App\OpenApi\Public;

use OpenApi\Attributes as OA;

/**
 * Definição raiz (Info/Server) da documentação pública da API, contendo os
 * grupos Global, Private e Lookup. Esta classe não é instanciada: serve
 * apenas como "âncora" para os atributos globais lidos pelo swagger-php.
 *
 * Rota gerada: /api/documentation
 */
#[OA\Info(
    version: '1.0.0',
    title: 'Laravel Next Starter API — Global, Private & Lookup',
    description: "Documentação das APIs **Global**, **Private** e **Lookup** do projeto Laravel Next Starter.\n\n"
        . "- **Global**: endpoints comuns, disponíveis para qualquer usuário autenticado (ex.: mensagens/notificações).\n"
        . "- **Private**: área autosserviço para empresas clientes (multi-tenant, escopado pelo grupo de empresa do usuário autenticado).\n"
        . "- **Lookup**: endpoints de apoio (consulta de CEP, municípios, tipos de contato/endereço).\n\n"
        . "A documentação da área **Admin** fica em uma spec separada e protegida, disponível em `/api/documentation/admin`.\n\n"
        . 'Autenticação via **Bearer JWT**, obtido em `POST /api/login` (fluxo Private).',
    contact: new OA\Contact(name: 'Equipe de Desenvolvimento')
)]
#[OA\Server(
    url: '/api',
    description: 'Servidor da API (relativo ao host onde o Swagger UI está sendo servido)'
)]
#[OA\Tag(name: 'Global', description: 'Endpoints comuns a qualquer usuário autenticado (Admin ou Private).')]
#[OA\Tag(name: 'Private', description: 'Área autosserviço das empresas clientes (self-service), escopada pelo grupo de empresa do usuário logado.')]
#[OA\Tag(name: 'Lookup', description: 'Endpoints de apoio/consulta (CEP, municípios, tipos auxiliares).')]
class OpenApiSpec
{
}
