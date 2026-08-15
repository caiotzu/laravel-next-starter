<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Enums\MensagemOrigem;

use App\Auditoria\Auditavel;

class Mensagem extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $table = 'mensagens';

    protected $fillable = [
        'id',
        'titulo',
        'conteudo',
        'origem',
        'remetente_id',
    ];

    protected $casts = [
        'origem' => MensagemOrigem::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function remetente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'remetente_id', 'id');
    }

    public function direcionamento(): HasOne
    {
        return $this->hasOne(MensagemDirecionamento::class, 'mensagem_id', 'id');
    }

    public function destinatarios(): HasMany
    {
        return $this->hasMany(MensagemDestinatario::class, 'mensagem_id', 'id');
    }
}
