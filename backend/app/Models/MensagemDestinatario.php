<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MensagemDestinatario extends Model
{
    use HasUuids;

    protected $table = 'mensagem_destinatarios';

    protected $fillable = [
        'id',
        'mensagem_id',
        'usuario_id',
        'lida_em',
    ];

    protected $casts = [
        'lida_em' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function mensagem(): BelongsTo
    {
        return $this->belongsTo(Mensagem::class, 'mensagem_id', 'id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
    }

    public function scopeNaoLidas($query)
    {
        return $query->whereNull('lida_em');
    }

    public function scopeLidas($query)
    {
        return $query->whereNotNull('lida_em');
    }

    public function scopeDoUsuario($query, string $usuarioId)
    {
        return $query->where('usuario_id', $usuarioId);
    }
}
