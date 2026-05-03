<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Enums\EmpresaEnderecoTipo;

class EmpresaEndereco extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $table = 'empresa_enderecos';

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
        'tipo' => EmpresaEnderecoTipo::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id', 'id');
    }

    public function municipio(): BelongsTo
    {
        return $this->belongsTo(Municipio::class, 'municipio_id', 'id');
    }
}
