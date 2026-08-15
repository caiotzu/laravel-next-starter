<?php

namespace App\OpenApi\Shared;

use OpenApi\Attributes as OA;

/**
 * Componentes `responses` reutilizados via $ref em todas as operações
 * (ver app/Http/Controllers/**), evitando repetir a mesma definição de
 * erro em cada endpoint.
 */
#[OA\Response(
    response: 'ValidationError',
    description: 'Erro de validação dos campos enviados.',
    content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')
)]
class ValidationErrorResponseComponent
{
}

#[OA\Response(
    response: 'BusinessError',
    description: 'Erro de regra de negócio (ex.: violação de uma regra da aplicação).',
    content: new OA\JsonContent(ref: '#/components/schemas/BusinessErrorResponse')
)]
class BusinessErrorResponseComponent
{
}

#[OA\Response(
    response: 'Unauthorized',
    description: 'Não autenticado: token ausente, inválido, expirado, ou sessão associada ao token não está mais ativa.',
    content: new OA\JsonContent(ref: '#/components/schemas/BusinessErrorResponse')
)]
class UnauthorizedResponseComponent
{
}

#[OA\Response(
    response: 'Forbidden',
    description: 'Autenticado, porém sem permissão para executar esta ação.',
    content: new OA\JsonContent(ref: '#/components/schemas/BusinessErrorResponse')
)]
class ForbiddenResponseComponent
{
}

#[OA\Response(
    response: 'NotFound',
    description: 'Registro não encontrado.',
    content: new OA\JsonContent(ref: '#/components/schemas/BusinessErrorResponse')
)]
class NotFoundResponseComponent
{
}

#[OA\Response(
    response: 'ServerError',
    description: 'Erro inesperado no servidor.',
    content: new OA\JsonContent(ref: '#/components/schemas/BusinessErrorResponse')
)]
class ServerErrorResponseComponent
{
}

#[OA\Response(
    response: 'NoContent',
    description: 'Operação realizada com sucesso, sem conteúdo de retorno.'
)]
class NoContentResponseComponent
{
}
