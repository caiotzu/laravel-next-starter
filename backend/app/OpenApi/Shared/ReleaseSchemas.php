<?php

namespace App\OpenApi\Shared;

use OpenApi\Attributes as OA;

/**
 * Schemas de domínio do Release (novidades). Admin enxerga todos os
 * campos de gestão (contexto/status/timestamps); Private só o que já foi
 * publicado para o seu próprio contexto (ver ReleaseResource de cada
 * área).
 */
#[OA\Schema(
    schema: 'AdminRelease',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'contexto', type: 'string', enum: ['admin', 'private']),
        new OA\Property(property: 'titulo', type: 'string', maxLength: 150),
        new OA\Property(property: 'conteudo', type: 'string'),
        new OA\Property(property: 'tipo', type: 'string', enum: ['feature', 'improvement', 'fix', 'change']),
        new OA\Property(property: 'tipo_label', type: 'string', example: 'Novidade'),
        new OA\Property(property: 'versao', type: 'string', maxLength: 30),
        new OA\Property(property: 'status', type: 'string', enum: ['draft', 'published']),
        new OA\Property(property: 'publicado_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ],
    type: 'object'
)]
class AdminReleaseSchema
{
}

#[OA\Schema(
    schema: 'PrivateRelease',
    description: 'Sempre publicada (status/contexto omitidos, pois só existe um contexto e um status possível neste endpoint).',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'titulo', type: 'string', maxLength: 150),
        new OA\Property(property: 'conteudo', type: 'string'),
        new OA\Property(property: 'tipo', type: 'string', enum: ['feature', 'improvement', 'fix', 'change']),
        new OA\Property(property: 'tipo_label', type: 'string', example: 'Novidade'),
        new OA\Property(property: 'versao', type: 'string', maxLength: 30),
        new OA\Property(property: 'publicado_em', type: 'string', format: 'date-time'),
    ],
    type: 'object'
)]
class PrivateReleaseSchema
{
}
