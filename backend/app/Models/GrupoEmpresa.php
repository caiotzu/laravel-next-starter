<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GrupoEmpresa extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $table = 'grupo_empresas';

    protected $fillable = [
        'id',
        'nome',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    public function grupos(): HasMany
    {
        // Relaciona os grupos cujo entidade_tipo é "grupo_empresa"
        // e o entidade_id é o ID deste grupo_empresa
        return $this->hasMany(Grupo::class, 'entidade_id')
            ->where('entidade_tipo_id', function ($query) {
                $query->select('id')
                    ->from('entidade_tipos')
                    ->where('entidade_tabela', 'grupo_empresas')
                    ->limit(1);
            });
    }

    public function empresas(): HasMany
    {
        return $this->hasMany(Empresa::class, 'grupo_empresa_id', 'id');
    }
}
