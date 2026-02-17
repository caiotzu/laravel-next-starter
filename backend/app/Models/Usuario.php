<?php

namespace App\Models;

use Illuminate\Support\Str;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;



class Usuario extends Authenticatable implements JWTSubject
{
    use SoftDeletes;

    protected $table = 'usuarios';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'grupo_id',
        'nome',
        'email',
        'senha',
        'ativo',
        'remember_token',
        'avatar',
        'google2fa_enable',
        'google2fa_secret',
        'google2fa_confirmado_em',
        'ultimo_login_em',
        'ultimo_ip'
    ];

    protected $hidden = [
        'senha',
        'remember_token',
    ];

    protected $casts = [
        'google2fa_secret' => 'encrypted',
        'google2fa_confirmado_em' => 'datetime',
        'ultimo_login_em' => 'datetime',
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

    public function grupo(): BelongsTo
    {
        return $this->belongsTo(Grupo::class, 'grupo_id', 'id');
    }

    public function usuarioSessoes(): HasMany
    {
        return $this->hasMany(UsuarioSessao::class, 'usuario_id', 'id');
    }

    private function carregarGrupoComPermissoes(): ?Grupo
    {
        if ($this->relationLoaded('grupo')) {
            return $this->grupo;
        }

        return $this->grupo()
            ->with('permissoes')
            ->first();
    }

    public function permissoesCache(): array
    {
        $grupo = $this->carregarGrupoComPermissoes();

        if (! $grupo) {
            return [];
        }

        return cache()->remember(
            "permissao:u:{$this->id}:g:{$grupo->id}:v:{$grupo->versao}",
            now()->addHour(),
            function () use ($grupo) {

                // transforma em lookup O(1)
                return $grupo->permissoes
                    ->pluck('chave')
                    ->flip()
                    ->map(fn() => true)
                    ->toArray();
            }
        );
    }

    public function temPermissao(string $permissao): bool
    {
        return isset($this->permissoesCache()[$permissao]);
    }

    public function getAuthPassword()
    {
        return $this->senha;
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        $grupo = $this->carregarGrupoComPermissoes();

        return [
            'grupo_id' => $grupo?->id,
            'grupo_versao' => $grupo?->versao,
        ];
    }
}
