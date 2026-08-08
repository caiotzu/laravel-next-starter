<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Enums\AuditoriaAcao;
use App\Enums\AuditoriaOrigem;

class Auditoria extends Model
{
    use HasUuids;

    /**
     * Registro de auditoria é imutável: nunca é atualizado, apenas criado.
     */
    public $timestamps = false;

    protected $table = 'auditorias';

    protected $fillable = [
        'id',
        'entidade_tabela',
        'entidade_id',
        'agrupador_tabela',
        'agrupador_id',
        'acao',
        'usuario_id',
        'origem',
        'dados_antes',
        'dados_depois',
        'campos_alterados',
        'ip',
        'user_agent',
        'criado_em',
    ];

    protected $casts = [
        'acao' => AuditoriaAcao::class,
        'origem' => AuditoriaOrigem::class,
        'dados_antes' => 'array',
        'dados_depois' => 'array',
        'campos_alterados' => 'array',
        'criado_em' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function (self $model) {
            if (! $model->criado_em) {
                $model->criado_em = now();
            }
        });
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
    }
}
