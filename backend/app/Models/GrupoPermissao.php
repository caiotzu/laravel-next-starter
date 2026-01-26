<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;

class GrupoPermissao extends Model
{
    protected $table = 'grupo_permissoes';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'grupo_id',
        'permissao_id'
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (! $model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function grupo() {
        return $this->belongsTo(Grupo::class, 'grupo_id', 'id');
    }

    public function permissao() {
        return $this->belongsTo(Permissao::class, 'permissao_id', 'id');
    }
}
