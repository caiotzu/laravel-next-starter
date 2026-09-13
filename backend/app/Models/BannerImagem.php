<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BannerImagem extends Model
{
    use HasUuids;

    protected $table = 'banner_imagens';

    protected $fillable = [
        'id',
        'banner_id',
        'caminho',
        'mime_type',
        'tamanho',
        'ordem',
    ];

    protected $casts = [
        'tamanho' => 'integer',
        'ordem' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function banner(): BelongsTo
    {
        return $this->belongsTo(Banner::class, 'banner_id', 'id');
    }

    /**
     * Mesmo padrão já usado em ChamadoAnexo::caminho: o banco guarda o
     * caminho relativo no disco 'public', a URL absoluta é resolvida aqui
     * na leitura — nunca persistida, para não quebrar se APP_URL mudar.
     */
    protected function caminho(): Attribute
    {
        return Attribute::make(
            get: fn ($value) =>
                $value ? url(Storage::url($value)) : null
        );
    }
}
