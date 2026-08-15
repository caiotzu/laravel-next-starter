<?php

namespace App\OpenApi\Shared;

use OpenApi\Attributes as OA;

/**
 * Meta de paginação padrão do Laravel (LengthAwarePaginator serializado
 * por um ResourceCollection), usada em todos os endpoints "listar".
 */
#[OA\Schema(
    schema: 'PaginationLinks',
    properties: [
        new OA\Property(property: 'first', type: 'string', format: 'uri', nullable: true, example: '/api/admin/empresas?page=1'),
        new OA\Property(property: 'last', type: 'string', format: 'uri', nullable: true, example: '/api/admin/empresas?page=5'),
        new OA\Property(property: 'prev', type: 'string', format: 'uri', nullable: true, example: null),
        new OA\Property(property: 'next', type: 'string', format: 'uri', nullable: true, example: '/api/admin/empresas?page=2'),
    ],
    type: 'object'
)]
class PaginationLinksSchema
{
}

#[OA\Schema(
    schema: 'PaginationMeta',
    properties: [
        new OA\Property(property: 'current_page', type: 'integer', example: 1),
        new OA\Property(property: 'from', type: 'integer', nullable: true, example: 1),
        new OA\Property(property: 'last_page', type: 'integer', example: 5),
        new OA\Property(property: 'path', type: 'string', example: '/api/admin/empresas'),
        new OA\Property(property: 'per_page', type: 'integer', example: 15),
        new OA\Property(property: 'to', type: 'integer', nullable: true, example: 15),
        new OA\Property(property: 'total', type: 'integer', example: 68),
    ],
    type: 'object'
)]
class PaginationMetaSchema
{
}

/**
 * Formato de erro de validação (422), produzido pelo handler de exceções
 * global (bootstrap/app.php) a partir de uma ValidationException.
 */
#[OA\Schema(
    schema: 'ValidationErrorResponse',
    properties: [
        new OA\Property(
            property: 'errors',
            type: 'object',
            example: ['campo' => ['A mensagem de validação correspondente.']],
            additionalProperties: new OA\AdditionalProperties(
                type: 'array',
                items: new OA\Items(type: 'string')
            )
        ),
    ],
    type: 'object'
)]
class ValidationErrorResponseSchema
{
}

/**
 * Formato padrão de erro de negócio/HTTP (400/401/403/404/500), produzido
 * pelo mesmo handler global para BusinessException, AuthorizationException,
 * ModelNotFoundException, HttpExceptionInterface, etc.
 */
#[OA\Schema(
    schema: 'BusinessErrorResponse',
    properties: [
        new OA\Property(
            property: 'errors',
            properties: [
                new OA\Property(
                    property: 'business',
                    type: 'array',
                    items: new OA\Items(type: 'string'),
                    example: ['Descrição do erro de negócio.']
                ),
            ],
            type: 'object'
        ),
    ],
    type: 'object'
)]
class BusinessErrorResponseSchema
{
}
