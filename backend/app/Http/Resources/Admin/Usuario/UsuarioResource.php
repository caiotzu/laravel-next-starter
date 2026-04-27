<?php

namespace App\Http\Resources\Admin\Usuario;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'grupo_id' => $this->grupo_id,
            'nome' => $this->nome,
            'email' => $this->email,
            'status' => $this->status,
            'avatar' => $this->avatar,
            'google2fa_enable' => $this->google2fa_enable,
            'google2fa_confirmado_em' => $this->google2fa_confirmado_em,
            'ultimo_login_em' => $this->ultimo_login_em,
            'ultimo_ip' => $this->ultimo_ip,
            'updated_at' => $this->updated_at,
            'created_at' => $this->created_at,
            'deleted_at' => $this->deleted_at,
        ];
    }
}
