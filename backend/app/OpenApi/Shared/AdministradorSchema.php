<?php

namespace App\OpenApi\Shared;

use OpenApi\Attributes as OA;

/**
 * Item retornado por Lookup\AdministradorController::listar (ver
 * AdministradorResource) — usado nos seletores de concessão de Acesso de
 * Suporte.
 */
#[OA\Schema(
    schema: 'Administrador',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'nome', type: 'string'),
        new OA\Property(property: 'email', type: 'string', format: 'email'),
    ],
    type: 'object'
)]
class AdministradorSchema
{
}
