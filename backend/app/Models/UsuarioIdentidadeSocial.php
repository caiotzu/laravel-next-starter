<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Auditoria\Auditavel;

class UsuarioIdentidadeSocial extends Model
{
    use HasUuids;
    use Auditavel;

    protected $table = 'usuario_identidades_sociais';

    protected $fillable = [
        'usuario_id',
        'provedor',
        'provedor_usuario_id',
        'email',
        'ultimo_login_em',
    ];

    protected $casts = [
        'ultimo_login_em' => 'datetime',
    ];

    /** Muda a cada login: não precisa de auditoria. */
    protected array $auditavelOculto = [
        'ultimo_login_em',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
    }

    /** O vínculo aparece no histórico do próprio usuário. */
    protected function auditavelAgrupador(): ?Model
    {
        return $this->usuario;
    }
}
