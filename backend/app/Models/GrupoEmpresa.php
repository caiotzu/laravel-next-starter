<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;


class GrupoEmpresa extends Model
{
    use SoftDeletes;

    protected $table = 'grupo_empresas';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'nome',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (! $model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}
