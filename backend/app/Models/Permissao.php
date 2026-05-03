<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permissao extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $table = 'permissoes';

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

    public function grupos(): BelongsToMany
    {
        return $this->belongsToMany(Grupo::class,'grupo_permissoes');
    }
}
