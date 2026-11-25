<?php

namespace App\Http\Resources\Global\AutenticacaoSocial;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VinculoSocialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'chave' => $this['chave'],
            'nome' => $this['nome'],
            'disponivel' => $this['disponivel'],
            'vinculado' => $this['vinculado'],
            'email' => $this['email'],
            'vinculado_em' => $this['vinculado_em'],
            'ultimo_login_em' => $this['ultimo_login_em'],
        ];
    }
}
