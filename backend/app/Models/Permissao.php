<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permissao extends Model
{
    protected $table = 'permissoes';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'chave',
        'descricao'
    ];

    public function grupoPermissoes() {
        return $this->hasMany(GrupoPermissao::class, 'permissao_id', 'id');
    }
}
