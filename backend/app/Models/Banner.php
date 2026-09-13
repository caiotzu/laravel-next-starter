<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

use App\Enums\BannerStatus;
use App\Enums\BannerDirecionamentoTipo;

/**
 * Campanha de banner exibida no Private, de acordo com o direcionamento e
 * o período configurados. Ver BannerService::disponiveisPara para a regra
 * completa de elegibilidade (status + período + direcionamento).
 */
class Banner extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $table = 'banners';

    protected $fillable = [
        'id',
        'titulo',
        'conteudo',
        'status',
        'direcionamento_tipo',
        'entidade_tipo_id',
        'inicio_em',
        'fim_em',
    ];

    protected $casts = [
        'status' => BannerStatus::class,
        'direcionamento_tipo' => BannerDirecionamentoTipo::class,
        'inicio_em' => 'datetime',
        'fim_em' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function entidadeTipo(): BelongsTo
    {
        return $this->belongsTo(EntidadeTipo::class, 'entidade_tipo_id', 'id');
    }

    public function imagens(): HasMany
    {
        return $this->hasMany(BannerImagem::class, 'banner_id', 'id')->orderBy('ordem');
    }

    public function links(): HasMany
    {
        return $this->hasMany(BannerLink::class, 'banner_id', 'id')->orderBy('ordem');
    }

    public function estaAtivo(): bool
    {
        return $this->status === BannerStatus::ATIVO;
    }

    /**
     * Escopo único de elegibilidade — status + janela de período. Usado
     * tanto pela consulta pública (Private) quanto por qualquer outro
     * lugar que precise saber "esse banner pode ser exibido agora?", para
     * nunca duplicar essa regra em mais de um ponto do código.
     */
    public function scopeDisponivelAgora(Builder $query): Builder
    {
        $agora = now();

        return $query
            ->where('status', BannerStatus::ATIVO->value)
            ->where('inicio_em', '<=', $agora)
            ->where(fn (Builder $q) => $q->whereNull('fim_em')->orWhere('fim_em', '>=', $agora));
    }
}
