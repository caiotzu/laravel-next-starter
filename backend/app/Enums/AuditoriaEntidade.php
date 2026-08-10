<?php

namespace App\Enums;

use Illuminate\Database\Eloquent\Model;

use App\Models\Grupo;
use App\Models\Empresa;
use App\Models\Usuario;

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

    public function formatarRegistro(Model $registro): array
    {
        return match ($this) {
            self::EMPRESAS => [
                'id' => $registro->id,
                'label' => $registro->cnpj.' - '.$registro->nome_fantasia,
            ],
            self::USUARIOS => [
                'id' => $registro->id,
                'label' => $registro->nome.' ('.$registro->email.')',
            ],
            self::GRUPOS => [
                'id' => $registro->id,
                'label' => $registro->descricao,
            ],
        };
    }
}
