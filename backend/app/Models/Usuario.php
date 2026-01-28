<?php

namespace App\Models;

use Illuminate\Support\Str;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Database\Eloquent\SoftDeletes;
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
        'google2fa_secret'
    ];

    protected $hidden = [
        'senha',
        'remember_token',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (! $model->id) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function grupo() {
        return $this->belongsTo(Grupo::class, 'grupo_id', 'id');
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
        return [];
    }
}
