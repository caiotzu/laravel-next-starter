<?php

namespace App\Enums;

/**
 * Tipos de direcionamento suportados no cadastro de uma mensagem.
 * Novos tipos (ex: empresa, perfil, todos) podem ser adicionados aqui
 * futuramente sem a necessidade de reestruturar as tabelas existentes.
 */
enum MensagemDirecionamentoTipo: string
{
    case GRUPO_EMPRESA = 'grupo_empresa'; // Todos os usuários das empresas de um grupo de empresa
    case USUARIO = 'usuario';             // Um único usuário

    public function label(): string
    {
        return match ($this) {
            self::GRUPO_EMPRESA => 'Grupo de empresa',
            self::USUARIO => 'Usuário',
        };
    }
}
