<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TokenResetSenha extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $table = 'tokens_reset_senha';

    protected $fillable = [
        'id',
        'usuario_id',
        'token',
        'expira_em',
        'usado_em',
    ];

    protected $casts = [
        'expira_em' => 'datetime',
        'usado_em' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
    }
}
