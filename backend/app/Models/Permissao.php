<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (! $model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function grupos(): BelongsToMany
    {
        return $this->belongsToMany(Grupo::class,'grupo_permissoes');
    }
}
