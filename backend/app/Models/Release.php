<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Enums\ReleaseTipo;
use App\Enums\ReleaseStatus;

/**
 * Registro de novidade/melhoria/correção da plataforma, exibido aos
 * usuários finais na tela de Releases.
 *
 * O contexto (ADMIN, PRIVATE, e futuramente outros) usa o MESMO mecanismo
 * já empregado em grupos.entidade_tipo_id / acessos_suporte.entidade_tipo_id
 * (ver Grupo::entidade(), AcessoSuporte::entidadeTipo()): nada nesta classe
 * ou no ReleaseService sabe o que é "Private" — isso vive no dado
 * (entidade_tipos), não no código. Um novo contexto não exige alterar nada
 * aqui.
 */
class Release extends Model
{
    use HasUuids;

    protected $table = 'releases';

    protected $fillable = [
        'id',
        'entidade_tipo_id',
        'titulo',
        'conteudo',
        'tipo',
        'versao',
        'status',
        'publicado_em',
    ];

    protected $casts = [
        'tipo' => ReleaseTipo::class,
        'status' => ReleaseStatus::class,
        'publicado_em' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function entidadeTipo(): BelongsTo
    {
        return $this->belongsTo(EntidadeTipo::class, 'entidade_tipo_id', 'id');
    }

    public function estaPublicada(): bool
    {
        return $this->status === ReleaseStatus::PUBLISHED;
    }
}
