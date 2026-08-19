<?php

namespace App\Http\Resources\Private\AcessoSuporte;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcessoSuporteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'admin' => [
                'id' => $this->admin?->id,
                'nome' => $this->admin?->nome,
                'email' => $this->admin?->email,
            ],
            'motivo' => $this->motivo,
            'iniciado_em' => $this->iniciado_em,
            'expira_em' => $this->expira_em,
            'encerrado_em' => $this->encerrado_em,
            'encerrado_por' => $this->encerrado_por,
            'ativo' => $this->estaValido(),
            'created_at' => $this->created_at,
        ];
    }
}
