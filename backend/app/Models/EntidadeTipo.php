<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EntidadeTipo extends Model
{
    use SoftDeletes;

    protected $table = 'entidade_tipos';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'chave',
        'entidade_tabela'
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (! $model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function grupos() {
        return $this->hasMany(Grupo::class, 'entidade_tipo_id', 'id');
    }
}
