<?php

namespace App\Models;

use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Usuario extends Authenticatable implements JWTSubject
{
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
