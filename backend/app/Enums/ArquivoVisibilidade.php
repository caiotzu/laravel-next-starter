<?php

namespace App\Enums;

/**
 * Como um arquivo deve ser tratado pela aplicação, independentemente de onde ele
 * é guardado (disco local, S3, ...):
 *
 *  - PUBLICO:  entregue por URL direta (ex.: avatar, imagens de banner);
 *  - PRIVADO:  nunca exposto por URL direta, só pela aplicação (ex.: anexos de
 *              chamado, entregues por link assinado em Global\ChamadoAnexoController).
 *
 * Qual disco do Laravel atende cada visibilidade é decidido em config('api.storage').
 */
enum ArquivoVisibilidade: string
{
    case PUBLICO = 'publico';
    case PRIVADO = 'privado';
}
