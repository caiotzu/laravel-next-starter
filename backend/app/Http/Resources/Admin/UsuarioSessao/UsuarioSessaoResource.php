<?php

namespace App\Http\Resources\Admin\UsuarioSessao;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioSessaoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'usuario_id' => $this->usuario_id,
            'ip' => $this->ip,
            'user_agent' => $this->user_agent,
            'browser' => $this->browser,
            'plataforma' => $this->plataforma,
            'dispositivo' => $this->dispositivo,
            'ativo' => $this->ativo,
            'ultimo_acesso_em' => $this->ultimo_acesso_em,
            'logout_em' => $this->logout_em,
            "atual" => $this->atual,
            'updated_at' => $this->updated_at,
            'created_at' => $this->created_at,
            'deleted_at' => $this->deleted_at,
        ];
    }
}
