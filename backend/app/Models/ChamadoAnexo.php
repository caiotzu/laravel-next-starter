<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;
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

    /**
     * Os anexos ficam em disco PRIVADO (nunca em /storage público). O que a API expõe em
     * `caminho` é uma URL assinada e temporária apontando para o endpoint de download
     * (ver Global\ChamadoAnexoController) — quem obtém o link só o usa por alguns minutos.
     *
     * A assinatura é relativa ao path (absolute: false) e o host vem de APP_URL, assim o link
     * continua válido independente do host interno pelo qual o BFF chama a API.
     * O caminho de armazenamento real está em caminhoArmazenado().
     */
    protected function caminho(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                if (! $value || ! $this->getKey()) {
                    return null;
                }

                $relativa = URL::temporarySignedRoute(
                    'chamados.anexos.baixar',
                    now()->addMinutes((int) config('api.chamados.anexo_url_expira_minutos', 30)),
                    ['anexo' => $this->getKey()],
                    absolute: false
                );

                return rtrim((string) config('app.url'), '/') . $relativa;
            }
        );
    }

    /**
     * Caminho relativo real do arquivo no disco (sem passar pelo accessor acima).
     */
    public function caminhoArmazenado(): ?string
    {
        return $this->getRawOriginal('caminho');
    }
}
