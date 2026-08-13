<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Enums\MensagemDirecionamentoTipo;

class MensagemDirecionamento extends Model
{
    use HasUuids;

    protected $table = 'mensagem_direcionamentos';

    protected $fillable = [
        'id',
        'mensagem_id',
        'tipo',
        'entidade_tipo_id',
        'grupo_empresa_id',
        'usuario_id',
    ];

    protected $casts = [
        'tipo' => MensagemDirecionamentoTipo::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function mensagem(): BelongsTo
    {
        return $this->belongsTo(Mensagem::class, 'mensagem_id', 'id');
    }

    public function entidadeTipo(): BelongsTo
    {
        return $this->belongsTo(EntidadeTipo::class, 'entidade_tipo_id', 'id');
    }

    public function grupoEmpresa(): BelongsTo
    {
        return $this->belongsTo(GrupoEmpresa::class, 'grupo_empresa_id', 'id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
    }
}
