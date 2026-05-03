<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Municipio extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $table = 'municipios';

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

    public function empresaEnderecos(): HasMany
    {
        return $this->hasMany(EmpresaEndereco::class, 'municipio_id', 'id');
    }
}
