<?php

namespace App\OpenApi\Shared;

use OpenApi\Attributes as OA;

/**
 * Schemas de domínio do Acesso de Suporte. Admin (lado que recebe o
 * acesso) enxerga a entidade concedente e quem concedeu; Private (lado
 * que concede) enxerga o admin que recebeu (ver AcessoSuporteResource de
 * cada área).
 */
#[OA\Schema(
    schema: 'AdminAcessoSuporte',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'status', type: 'string', enum: ['ativo', 'expirado', 'revogado', 'encerrado']),
        new OA\Property(property: 'entidade', properties: [
            new OA\Property(property: 'tipo', type: 'string', enum: ['admin', 'private']),
            new OA\Property(property: 'id', type: 'string', format: 'uuid'),
            new OA\Property(property: 'nome', type: 'string', nullable: true),
        ], type: 'object'),
        new OA\Property(property: 'concedido_por', properties: [
            new OA\Property(property: 'id', type: 'string', format: 'uuid'),
            new OA\Property(property: 'nome', type: 'string'),
            new OA\Property(property: 'email', type: 'string', format: 'email'),
        ], type: 'object'),
        new OA\Property(property: 'motivo', type: 'string', nullable: true),
        new OA\Property(property: 'iniciado_em', type: 'string', format: 'date-time'),
        new OA\Property(property: 'expira_em', type: 'string', format: 'date-time'),
        new OA\Property(property: 'encerrado_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'encerrado_por', type: 'string', enum: ['cliente', 'admin', 'expiracao', 'sistema'], nullable: true),
        new OA\Property(property: 'ativo', type: 'boolean'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
    ],
    type: 'object'
)]
class AdminAcessoSuporteSchema
{
}

#[OA\Schema(
    schema: 'PrivateAcessoSuporte',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'status', type: 'string', enum: ['ativo', 'expirado', 'revogado', 'encerrado']),
        new OA\Property(property: 'admin', properties: [
            new OA\Property(property: 'id', type: 'string', format: 'uuid'),
            new OA\Property(property: 'nome', type: 'string'),
            new OA\Property(property: 'email', type: 'string', format: 'email'),
        ], type: 'object'),
        new OA\Property(property: 'motivo', type: 'string', nullable: true),
        new OA\Property(property: 'iniciado_em', type: 'string', format: 'date-time'),
        new OA\Property(property: 'expira_em', type: 'string', format: 'date-time'),
        new OA\Property(property: 'encerrado_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'encerrado_por', type: 'string', enum: ['cliente', 'admin', 'expiracao', 'sistema'], nullable: true),
        new OA\Property(property: 'ativo', type: 'boolean'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
    ],
    type: 'object'
)]
class PrivateAcessoSuporteSchema
{
}
