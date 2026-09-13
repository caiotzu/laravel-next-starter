<?php

namespace App\Enums;

/**
 * Tipos de direcionamento suportados no cadastro de um Banner.
 *
 * Reaproveita o MESMO conceito já usado em MensagemDirecionamentoTipo, mas
 * restrito apenas aos dois tipos que fazem sentido para Banner — nada de
 * usuário/grupo_empresa/permissão aqui (ver item 6 do pedido).
 */
enum BannerDirecionamentoTipo: string
{
    case GERAL = 'geral';       // Todos os usuários
    case ENTIDADE = 'entidade'; // Todos os usuários de uma entidade (ex: PRIVATE)

    public function label(): string
    {
        return match ($this) {
            self::GERAL => 'Todos',
            self::ENTIDADE => 'Entidade',
        };
    }
}
