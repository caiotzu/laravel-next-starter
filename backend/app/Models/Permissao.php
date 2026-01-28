<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;


class Permissao extends Model
{
    use SoftDeletes;

    protected $table = 'permissoes';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'chave',
        'descricao'
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (! $model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function grupoPermissoes() {
        return $this->hasMany(GrupoPermissao::class, 'permissao_id', 'id');
    }
}
