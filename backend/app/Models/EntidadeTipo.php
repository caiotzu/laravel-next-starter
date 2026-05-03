<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Enums\EntidadeTipo as EnumsEntidadeTipo;

class EntidadeTipo extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $table = 'entidade_tipos';

    protected $fillable = [
        'id',
        'chave',
        'entidade_tabela'
    ];

    protected $casts = [
        'chave' => EnumsEntidadeTipo::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    public function grupos(): HasMany
    {
        return $this->hasMany(Grupo::class, 'entidade_tipo_id', 'id');
    }
}
