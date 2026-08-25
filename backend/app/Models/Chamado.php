<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Enums\ChamadoTipo;
use App\Enums\ChamadoStatus;
use App\Enums\ChamadoPrioridade;

/**
 * Sem auditoria (decisão explícita — o histórico de comunicação já é
 * mantido pela conversa em ChamadoMensagem; não usa a trait Auditavel).
 */
class Chamado extends Model
{
    use HasUuids;

    protected $table = 'chamados';

    protected $fillable = [
        'id',
        'ticket',
        'usuario_id',
        'responsavel_id',
        'tipo',
        'assunto',
        'status',
        'prioridade',
        'aberto_em',
        'fechado_em',
        'primeira_resposta_em',
        'ultima_interacao_em',
    ];

    protected $casts = [
        'tipo' => ChamadoTipo::class,
        'status' => ChamadoStatus::class,
        'prioridade' => ChamadoPrioridade::class,
        'aberto_em' => 'datetime',
        'fechado_em' => 'datetime',
        'primeira_resposta_em' => 'datetime',
        'ultima_interacao_em' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
    }

    public function responsavel(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'responsavel_id', 'id');
    }

    public function mensagens(): HasMany
    {
        return $this->hasMany(ChamadoMensagem::class, 'chamado_id', 'id');
    }
}
