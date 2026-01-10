<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EntidadeTipo extends Model
{
    protected $table = 'entidade_tipos';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'chave',
        'entidade_tabela'
    ];

    public function grupos() {
        return $this->hasMany(Grupo::class, 'entidade_tipo_id', 'id');
    }
}
