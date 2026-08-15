<?php

namespace App\Enums;

use Illuminate\Database\Eloquent\Model;

use App\Models\Grupo;
use App\Models\Empresa;
use App\Models\Usuario;
use App\Enums\EntidadeTipo as EntidadeTipoChave;

enum AuditoriaEntidade: string
{
    case EMPRESAS = 'empresas';
    case USUARIOS = 'usuarios';
    case GRUPOS = 'grupos';

    public function label(): string
    {
        return match ($this) {
            self::EMPRESAS => 'Empresas',
            self::USUARIOS => 'Usuários',
            self::GRUPOS => 'Grupos',
        };
    }

    public function modelClass(): string
    {
        return match ($this) {
            self::EMPRESAS => Empresa::class,
            self::USUARIOS => Usuario::class,
            self::GRUPOS => Grupo::class,
        };
    }

    public function camposPesquisa(): array
    {
        return match ($this) {
            self::EMPRESAS => ['id', 'nome_fantasia', 'razao_social', 'cnpj'],
            self::USUARIOS => ['id', 'nome', 'email'],
            self::GRUPOS => ['id', 'descricao'],
        };
    }

    public function campoOrdenacao(): string
    {
        return match ($this) {
            self::EMPRESAS => 'nome_fantasia',
            self::USUARIOS => 'nome',
            self::GRUPOS => 'descricao',
        };
    }

    /**
     * Relacionamentos que devem ser eager-loaded para montar o label em
     * formatarRegistro(), evitando N+1 (ex.: Usuario->grupo->entidadeTipo
     * para diferenciar Usuário de Usuário Entidade).
     */
    public function relacionamentosParaListagem(): array
    {
        return match ($this) {
            self::USUARIOS => ['grupo.entidadeTipo'],
            self::GRUPOS => ['grupoEmpresa', 'entidadeTipo'],
            default => [],
        };
    }

    public function formatarRegistro(Model $registro): array
    {
        return match ($this) {
            self::EMPRESAS => [
                'id' => $registro->id,
                'label' => formatar_cpf_cnpj($registro->cnpj) . ' • ' . $registro->nome_fantasia,
            ],

            self::USUARIOS => [
                'id' => $registro->id,
                'label' => $registro->nome
                    . ' • '
                    . $registro->email
                    . ' • '
                    . $registro->grupo->entidadeTipo->chave->name,
            ],

            self::GRUPOS => [
                'id' => $registro->id,
                'label' => $registro->grupoEmpresa
                    ? $registro->descricao
                        . ' • '
                        . $registro->grupoEmpresa->nome
                        . ' • '
                        . $registro->entidadeTipo->chave->name
                    : $registro->descricao
                        . ' • '
                        . $registro->entidadeTipo->chave->name,
            ],
        };
    }
}
