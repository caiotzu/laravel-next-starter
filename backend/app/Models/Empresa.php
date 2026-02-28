<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Empresa extends Model
{
    use SoftDeletes;

    protected $table = 'empresas';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'grupo_empresa_id',
        'matriz_id',
        'cnpj',
        'nome_fantasia',
        'razao_social',
        'inscricao_estadual',
        'inscricao_municipal',
        'ativo',
        'uf',
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

    public function grupoEmpresa(): BelongsTo
    {
        return $this->belongsTo(GrupoEmpresa::class, 'grupo_empresa_id', 'id');
    }

    public function contatos(): HasMany
    {
        return $this->hasMany(EmpresaContato::class, 'empresa_id', 'id');
    }

    public function enderecos(): HasMany
    {
        return $this->hasMany(EmpresaEndereco::class, 'empresa_id', 'id');
    }
}
