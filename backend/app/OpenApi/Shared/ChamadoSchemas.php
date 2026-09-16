<?php

namespace App\OpenApi\Shared;

use OpenApi\Attributes as OA;

/**
 * Schemas de domínio do Chamado (Suporte). Documentados aqui pois faltava
 * schema de resposta para os endpoints de listagem/visualização/resposta
 * (ver ChamadoResource de cada área) — Admin e Private têm campos
 * diferentes (Admin expõe prioridade/cliente/responsavel), por isso não
 * são o mesmo schema.
 */
#[OA\Schema(
    schema: 'ChamadoAnexo',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'nome_original', type: 'string'),
        new OA\Property(property: 'url', type: 'string'),
        new OA\Property(property: 'mime_type', type: 'string', example: 'application/pdf'),
        new OA\Property(property: 'tamanho', type: 'integer', description: 'Tamanho do arquivo em bytes.'),
    ],
    type: 'object'
)]
class ChamadoAnexoSchema
{
}

#[OA\Schema(
    schema: 'ChamadoMensagem',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'mensagem', type: 'string'),
        new OA\Property(property: 'usuario', properties: [
            new OA\Property(property: 'id', type: 'string', format: 'uuid'),
            new OA\Property(property: 'nome', type: 'string'),
        ], type: 'object'),
        new OA\Property(property: 'anexos', type: 'array', items: new OA\Items(ref: '#/components/schemas/ChamadoAnexo')),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
    ],
    type: 'object'
)]
class ChamadoMensagemSchema
{
}

#[OA\Schema(
    schema: 'AdminChamado',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'ticket', type: 'string'),
        new OA\Property(property: 'assunto', type: 'string'),
        new OA\Property(property: 'tipo', type: 'string', enum: ['financeiro', 'plataforma', 'acesso', 'duvida', 'documentacao', 'operacional', 'outros']),
        new OA\Property(property: 'tipo_label', type: 'string', example: 'Financeiro'),
        new OA\Property(property: 'status', type: 'string', enum: ['aberto', 'em_atendimento', 'aguardando_cliente', 'aguardando_suporte', 'resolvido', 'fechado', 'cancelado']),
        new OA\Property(property: 'status_label', type: 'string', example: 'Aberto'),
        new OA\Property(property: 'prioridade', type: 'string', enum: ['baixa', 'normal', 'alta', 'urgente']),
        new OA\Property(property: 'prioridade_label', type: 'string', example: 'Normal'),
        new OA\Property(property: 'cliente', properties: [
            new OA\Property(property: 'id', type: 'string', format: 'uuid'),
            new OA\Property(property: 'nome', type: 'string'),
            new OA\Property(property: 'email', type: 'string', format: 'email'),
        ], type: 'object'),
        new OA\Property(property: 'responsavel', properties: [
            new OA\Property(property: 'id', type: 'string', format: 'uuid'),
            new OA\Property(property: 'nome', type: 'string'),
        ], type: 'object', nullable: true),
        new OA\Property(property: 'aberto_em', type: 'string', format: 'date-time'),
        new OA\Property(property: 'fechado_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'primeira_resposta_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'ultima_interacao_em', type: 'string', format: 'date-time'),
        new OA\Property(property: 'mensagens', type: 'array', items: new OA\Items(ref: '#/components/schemas/ChamadoMensagem')),
    ],
    type: 'object'
)]
class AdminChamadoSchema
{
}

#[OA\Schema(
    schema: 'PrivateChamado',
    description: 'Mesma entidade do AdminChamado, mas sem os campos de gestão interna (prioridade, cliente, responsável).',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'ticket', type: 'string'),
        new OA\Property(property: 'assunto', type: 'string'),
        new OA\Property(property: 'tipo', type: 'string', enum: ['financeiro', 'plataforma', 'acesso', 'duvida', 'documentacao', 'operacional', 'outros']),
        new OA\Property(property: 'tipo_label', type: 'string', example: 'Financeiro'),
        new OA\Property(property: 'status', type: 'string', enum: ['aberto', 'em_atendimento', 'aguardando_cliente', 'aguardando_suporte', 'resolvido', 'fechado', 'cancelado']),
        new OA\Property(property: 'status_label', type: 'string', example: 'Aberto'),
        new OA\Property(property: 'aberto_em', type: 'string', format: 'date-time'),
        new OA\Property(property: 'fechado_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'ultima_interacao_em', type: 'string', format: 'date-time'),
        new OA\Property(property: 'mensagens', type: 'array', items: new OA\Items(ref: '#/components/schemas/ChamadoMensagem')),
    ],
    type: 'object'
)]
class PrivateChamadoSchema
{
}
