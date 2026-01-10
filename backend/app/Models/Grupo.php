<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grupo extends Model
{
    protected $table = 'grupos';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'descricao',
        'entidade_tipo_id',
        'entidade_id'
    ];

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
