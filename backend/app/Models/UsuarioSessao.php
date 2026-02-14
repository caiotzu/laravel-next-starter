<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UsuarioSessao extends Model
{
    use HasUuids;

    protected $table = 'usuario_sessoes';

    protected $fillable = [
        'id',
        'usuario_id',
        'ip',
        'user_agent',
        'browser',
        'plataforma',
        'dispositivo',
        'ativo',
        'ultimo_acesso_em',
        'logout_em',
    ];

    protected $casts = [
        'ultimo_acesso_em' => 'datetime',
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

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
    }
}

