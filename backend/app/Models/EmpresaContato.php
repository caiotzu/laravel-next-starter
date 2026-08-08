<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Enums\EmpresaContatoTipo;

use App\Auditoria\Auditavel;

class EmpresaContato extends Model
{
    use HasUuids;
    use Auditavel;
    use SoftDeletes;

    protected $table = 'empresa_contatos';

    protected $fillable = [
        'id',
        'empresa_id',
        'tipo',
        'valor',
        'ativo',
        'principal'
    ];

    protected $casts = [
        'tipo' => EmpresaContatoTipo::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id', 'id');
    }

    /**
     * Usado pela trait Auditavel para agrupar o histórico deste contato sob
     * o histórico da Empresa dona dele, sem precisar de uma query extra.
     */
    protected function auditavelAgrupador(): ?Model
    {
        return $this->empresa_id
            ? new Empresa(['id' => $this->empresa_id])
            : null;
    }
}
