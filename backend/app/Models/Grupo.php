<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Grupo extends Model
{
    use SoftDeletes;

    protected $table = 'grupos';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'descricao',
        'entidade_tipo_id',
        'entidade_id'
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (! $model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function usuarios() {
        return $this->hasMany(Usuario::class, 'grupo_id', 'id');
    }

    public function grupoPermissoes() {
        return $this->hasMany(GrupoPermissao::class, 'grupo_id', 'id');
    }

    public function entidadeTipo() {
        return $this->belongsTo(EntidadeTipo::class, 'entidade_tipo_id', 'id');
    }
}
