<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChamadoAnexo extends Model
{
    use HasUuids;

    protected $table = 'chamado_anexos';

    protected $fillable = [
        'id',
        'chamado_mensagem_id',
        'nome_original',
        'caminho',
        'mime_type',
        'tamanho',
    ];

    protected $casts = [
        'tamanho' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function chamadoMensagem(): BelongsTo
    {
        return $this->belongsTo(ChamadoMensagem::class, 'chamado_mensagem_id', 'id');
    }

    protected function caminho(): Attribute
    {
        return Attribute::make(
            get: fn ($value) =>
                $value ? url(Storage::url($value)) : null
        );
    }
}
