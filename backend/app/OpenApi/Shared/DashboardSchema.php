<?php

namespace App\OpenApi\Shared;

use OpenApi\Attributes as OA;

/**
 * Resposta de Admin\DashboardController::visualizar (ver DashboardResource
 * e DashboardService — cada propriedade abaixo corresponde a um método de
 * DashboardService com o mesmo nome).
 */
#[OA\Schema(
    schema: 'Dashboard',
    properties: [
        new OA\Property(property: 'periodo', properties: [
            new OA\Property(property: 'inicio', type: 'string', format: 'date'),
            new OA\Property(property: 'fim', type: 'string', format: 'date'),
            new OA\Property(property: 'inicio_anterior', type: 'string', format: 'date'),
            new OA\Property(property: 'fim_anterior', type: 'string', format: 'date'),
        ], type: 'object'),

        new OA\Property(property: 'kpis', properties: [
            new OA\Property(property: 'total_empresas', type: 'integer'),
            new OA\Property(property: 'empresas_no_periodo', type: 'integer'),
            new OA\Property(property: 'empresas_variacao_percentual', type: 'number', format: 'float', nullable: true),
            new OA\Property(property: 'chamados_abertos', type: 'integer'),
            new OA\Property(property: 'chamados_no_periodo', type: 'integer'),
            new OA\Property(property: 'chamados_variacao_percentual', type: 'number', format: 'float', nullable: true),
            new OA\Property(property: 'chamados_fechados_no_periodo', type: 'integer'),
            new OA\Property(property: 'chamados_fechados_variacao_percentual', type: 'number', format: 'float', nullable: true),
            new OA\Property(property: 'tempo_medio_resolucao_segundos', type: 'number', format: 'float', nullable: true),
            new OA\Property(property: 'tempo_medio_resolucao_variacao_percentual', type: 'number', format: 'float', nullable: true, description: 'Sinal invertido: uma redução no tempo é sempre reportada como variação positiva.'),
        ], type: 'object'),

        new OA\Property(
            property: 'evolucao_chamados',
            description: 'Série diária no intervalo do período filtrado.',
            type: 'array',
            items: new OA\Items(properties: [
                new OA\Property(property: 'data', type: 'string', format: 'date'),
                new OA\Property(property: 'abertos', type: 'integer'),
                new OA\Property(property: 'fechados', type: 'integer'),
            ], type: 'object')
        ),

        new OA\Property(
            property: 'evolucao_empresas',
            description: 'Série diária no intervalo do período filtrado.',
            type: 'array',
            items: new OA\Items(properties: [
                new OA\Property(property: 'data', type: 'string', format: 'date'),
                new OA\Property(property: 'novas', type: 'integer'),
            ], type: 'object')
        ),

        new OA\Property(
            property: 'empresas_por_status',
            description: 'Total de empresas (independente do período) agrupado por status. Chaves dinâmicas (ex.: "ativo", "inativo", "pendente", "bloqueado").',
            type: 'object',
            additionalProperties: new OA\AdditionalProperties(type: 'integer'),
            example: ['ativo' => 42, 'pendente' => 3]
        ),
        new OA\Property(
            property: 'chamados_por_status',
            description: 'Chamados abertos no período agrupados por status. Chaves dinâmicas (ex.: "aberto", "em_atendimento", "resolvido", "fechado").',
            type: 'object',
            additionalProperties: new OA\AdditionalProperties(type: 'integer'),
            example: ['aberto' => 12, 'resolvido' => 8]
        ),
        new OA\Property(
            property: 'chamados_por_prioridade',
            description: 'Chamados abertos no período agrupados por prioridade. Chaves dinâmicas (ex.: "baixa", "normal", "alta", "urgente").',
            type: 'object',
            additionalProperties: new OA\AdditionalProperties(type: 'integer'),
            example: ['normal' => 15, 'urgente' => 2]
        ),
        new OA\Property(
            property: 'chamados_por_tipo',
            description: 'Chamados abertos no período agrupados por tipo. Chaves dinâmicas (ex.: "financeiro", "plataforma", "duvida").',
            type: 'object',
            additionalProperties: new OA\AdditionalProperties(type: 'integer'),
            example: ['duvida' => 9, 'plataforma' => 4]
        ),

        new OA\Property(
            property: 'ranking_responsaveis',
            description: 'Top responsáveis por chamados encerrados no período, ordenado do maior para o menor total.',
            type: 'array',
            items: new OA\Items(properties: [
                new OA\Property(property: 'responsavel_id', type: 'string', format: 'uuid'),
                new OA\Property(property: 'responsavel_nome', type: 'string'),
                new OA\Property(property: 'total_encerrados', type: 'integer'),
                new OA\Property(property: 'tempo_medio_segundos', type: 'number', format: 'float'),
            ], type: 'object')
        ),

        new OA\Property(property: 'chamados_sem_responsavel', properties: [
            new OA\Property(property: 'total', type: 'integer', description: 'Total de chamados ativos sem responsável (não limitado pela amostra abaixo).'),
            new OA\Property(property: 'chamados', type: 'array', items: new OA\Items(properties: [
                new OA\Property(property: 'id', type: 'string', format: 'uuid'),
                new OA\Property(property: 'ticket', type: 'string'),
                new OA\Property(property: 'assunto', type: 'string'),
                new OA\Property(property: 'aberto_em', type: 'string', format: 'date-time'),
                new OA\Property(property: 'cliente_nome', type: 'string', nullable: true),
            ], type: 'object')),
        ], type: 'object'),

        new OA\Property(
            property: 'chamados_mais_antigos',
            description: 'Chamados ainda em aberto há mais tempo (não limitado ao período filtrado).',
            type: 'array',
            items: new OA\Items(properties: [
                new OA\Property(property: 'id', type: 'string', format: 'uuid'),
                new OA\Property(property: 'ticket', type: 'string'),
                new OA\Property(property: 'assunto', type: 'string'),
                new OA\Property(property: 'status', type: 'string', enum: ['aberto', 'em_atendimento', 'aguardando_cliente', 'aguardando_suporte', 'resolvido', 'fechado', 'cancelado']),
                new OA\Property(property: 'aberto_em', type: 'string', format: 'date-time'),
                new OA\Property(property: 'cliente_nome', type: 'string', nullable: true),
            ], type: 'object')
        ),

        new OA\Property(property: 'tempo_atendimento', properties: [
            new OA\Property(property: 'resolucao', properties: [
                new OA\Property(property: 'media_segundos', type: 'number', format: 'float', nullable: true),
                new OA\Property(property: 'mediana_segundos', type: 'number', format: 'float', nullable: true),
                new OA\Property(property: 'amostras', type: 'integer'),
            ], type: 'object'),
            new OA\Property(property: 'primeira_resposta', properties: [
                new OA\Property(property: 'media_segundos', type: 'number', format: 'float', nullable: true),
                new OA\Property(property: 'amostras', type: 'integer'),
            ], type: 'object'),
        ], type: 'object'),
    ],
    type: 'object'
)]
class DashboardSchema
{
}
