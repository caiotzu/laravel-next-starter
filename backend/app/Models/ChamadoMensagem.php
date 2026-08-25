<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChamadoMensagem extends Model
{
    use HasUuids;

    protected $table = 'chamado_mensagens';

    protected $fillable = [
        'id',
        'chamado_id',
        'usuario_id',
        'mensagem',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function chamado(): BelongsTo
    {
        return $this->belongsTo(Chamado::class, 'chamado_id', 'id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
    }

    public function anexos(): HasMany
    {
        return $this->hasMany(ChamadoAnexo::class, 'chamado_mensagem_id', 'id');
    }
}
