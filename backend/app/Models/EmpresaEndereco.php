<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class EmpresaEndereco extends Model
{
    use SoftDeletes;

    protected $table = 'empresa_enderecos';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'empresa_id',
        'tipo',
        'municipio_id',
        'ativo',
        'principal',
        'cep',
        'logradouro',
        'numero',
        'bairro',
        'complemento'
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

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id', 'id');
    }

    public function municipio(): BelongsTo
    {
        return $this->belongsTo(Municipio::class, 'municipio_id', 'id');
    }
}
