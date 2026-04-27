<?php

namespace App\Http\Resources\Admin\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this['id'],
            'nome' => $this['nome'],
            'email' => $this['email'],
            'avatar' => $this['avatar'],
            'grupo' => $this['grupo'],
            'status' => $this['status'],
            'google2fa_enable' => $this['google2fa_enable'],
            'google2fa_confirmado_em' => $this['google2fa_confirmado_em'],
            'ultimo_login_em' => $this['ultimo_login_em'],
            'ultimo_ip' => $this['ultimo_ip'],
            'permissoes' => $this['permissoes'],
        ];
    }
}
