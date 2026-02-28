<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Municipio extends Model
{
    use SoftDeletes;

    protected $table = 'municipios';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'nome',
        'uf',
        'codigo_ibge',
        'codigo_siafi'
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

    public function empresaEnderecos(): HasMany
    {
        return $this->hasMany(EmpresaEndereco::class, 'municipio_id', 'id');
    }
}
