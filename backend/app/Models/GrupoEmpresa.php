<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GrupoEmpresa extends Model
{
    use SoftDeletes;

    protected $table = 'grupo_empresas';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'nome',
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
}
